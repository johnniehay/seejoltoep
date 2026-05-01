import { ComponentConfig, PuckComponent } from "@puckeditor/core";
import { getPayload } from "payload";
import { ShopProductsDisplay, ShopProps } from "@/puck/components/Shop/index";

import configPromise from "@payload-config";

export const ShopPuckComponent: PuckComponent<ShopProps> = ({ q, sort, category, ...restShopProps}: ShopProps) => {
  return (<ShopPuckComponentAsync q={q} sort={sort} category={category} {...restShopProps}/>)
}
export async function ShopPuckComponentAsync({ q:searchValue, sort, category, ...restShopProps}: ShopProps) {
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInZAR: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue || category
      ? {
        where: {
          and: [
            {
              _status: {
                equals: 'published',
              },
            },
            ...(searchValue
              ? [
                {
                  or: [
                    {
                      title: {
                        like: searchValue,
                      },
                    },
                    {
                      description: {
                        like: searchValue,
                      },
                    },
                  ],
                },
              ]
              : []),
            ...(category
              ? [
                {
                  categories: {
                    contains: category,
                  },
                },
              ]
              : []),
          ],
        },
      }
      : {}),
  })

  const resultsText = products.docs.length > 1 ? 'resultate' : 'resultaat'

  return (
    <div>
      {searchValue && products.docs?.length === 0 ? (
        <p className="mb-4">
          Daar is geen produkte wat ooreenstem met
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4">Geen produkte gevind nie. Probeer asseblief ander filters.</p>
      )}

      {products?.docs.length > 0 ? (
        <ShopProductsDisplay products={products} {...restShopProps}/>
      ) : null}
    </div>
  )
}

export const Shop: ComponentConfig<ShopProps> = {
  render: ShopPuckComponent,
};
