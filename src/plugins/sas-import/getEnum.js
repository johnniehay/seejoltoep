/**
 * Standalone script to fetch SAS enumeration and status values.
 * Usage: node getEnum.js <YOUR_WEBHOOK_URL> <KAMP_ID>
 */

const webhookUrl = process.argv[2];
const kampId = process.argv[3];

if (!webhookUrl || !kampId) {
  console.error('Usage: node getEnum.js <YOUR_WEBHOOK_URL> <KAMP_ID>');
  process.exit(1);
}

const ENTITIES = {
  AddOptions: 144,
  Inskrywings: 150,
  Courses: 171,
};

async function fetchBatch(commands) {
  const url = webhookUrl.endsWith('/') ? webhookUrl : webhookUrl + '/';
  const response = await fetch(url + 'batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ halt: 0, cmd: commands }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error_description || 'Batch error');
  return data.result;
}

async function fetchList(method, params) {
  const url = webhookUrl.endsWith('/') ? webhookUrl : webhookUrl + '/';
  let start = 0;
  let allItems = [];
  let hasNext = true;

  while (hasNext) {
    const response = await fetch(url + method, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, start }),
    });
    const data = await response.json();
    const resultData = data.result;
    // Bitrix returns items under various keys or directly as result for some endpoints
    const items = resultData.items || resultData.productRows || (Array.isArray(resultData) ? resultData : []);
    if (Array.isArray(items)) allItems = allItems.concat(items);

    if (data.next) {
      start = data.next;
    } else {
      hasNext = false;
    }
  }
  return allItems;
}

async function run() {
  const output = {};
  const commands = {};

  console.log('--- Requesting Field Definitions and Statuses ---');

  // 1. Prepare Batch for Fields
  for (const [name, id] of Object.entries(ENTITIES)) {
    commands[`fields_${name}`] = `crm.item.fields?entityTypeId=${id}`;
  }

  // 2. Prepare Batch for specific Status Lists (Stages)
  // Entity 150 uses a specific category (39) as seen in service.ts
  commands['status_Inskrywings'] = `crm.status.list?filter[ENTITY_ID]=DYNAMIC_150_STAGE_39`;

  const batchResults = await fetchBatch(commands);
  const resultsMap = batchResults.result || {};

  // 3. Process Schema Fields (Enumerations)
  for (const [name, id] of Object.entries(ENTITIES)) {
    const fieldData = resultsMap[`fields_${name}`];
    if (!fieldData || !fieldData.fields) continue;

    const fields = fieldData.fields;
    for (const [key, config] of Object.entries(fields)) {
      const identifier = `${name}.${key} (${config.title})`;

      // Standard List Fields
      if (config.type === 'enumeration' && config.items) {
        output[identifier] = config.items.map(i => i.VALUE);
      }

      // Status Fields
      if (config.type === 'crm_status') {
        const statusKey = `status_${name}`;
        if (resultsMap[statusKey]) {
          output[identifier] = resultsMap[statusKey].map(s => s.NAME);
        } else {
          output[identifier] = [`[Lookup required for ${config.statusType || 'Status'}]`];
        }
      }

      // Booleans
      if (config.type === 'boolean') {
        output[identifier] = ['Ja', 'Nee'];
      }
    }
  }

  // 4. Handle "Additional Options" Dynamic Lists
  // As per service.ts logic: Items in entity 144 with specific type are list selections
  console.log('--- Fetching Dynamic Product Lists for AddOptions ---');
  const options = await fetchList('crm.item.list', {
    entityTypeId: ENTITIES.AddOptions,
    select: ['id', 'title', 'ufCrm45_1665999802'],
    filter: {
      parentId160: kampId,
    },
  });

  for (const option of options) {
    // 1257 is the hardcoded ID for "list selection" options in your service
    if (option.ufCrm45_1665999802 == 1257) {
      const identifier = `AddOptionList.${option.title}`;

      // Fetch product rows for this specific option
      const products = await fetchList('crm.item.productrow.list', {
        filter: {
          '=ownerType': 'T90',
          '=ownerId': option.id
        }
      });

      output[identifier] = products.map(p => p.productName);
    }
  }

  console.log('\n--- FETCH COMPLETE ---\n');
  console.log(JSON.stringify(output, null, 2));
}

run().catch(err => console.error('Fatal Error:', err));
