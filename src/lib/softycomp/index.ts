import type { Field, GroupField } from 'payload'
import type { PaymentAdapter, PaymentAdapterArgs } from '@payloadcms/plugin-ecommerce/types'
import { initiatePayment } from './initiatePayment'
import { confirmOrder } from './confirmOrder'
import { softyCompCallbackEndpoint } from './callback'
import { defaultAddressFields } from "@/lib/softycomp/defaultAddressFields";

export const softyCompAdapter: (props?: PaymentAdapterArgs) => PaymentAdapter = (props) => {
  const { groupOverrides } = props || {}

  const baseFields: Field[] = [
    {
      name: 'userReference',
      type: 'text',
      label: 'SoftyComp User Reference',
    },
    {
      name: 'billReference',
      type: 'text',
      label: 'SoftyComp Bill Reference (Guid)',
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: defaultAddressFields(),
      label: 'Shipping Address',
    },

  ]

  const groupField: GroupField = {
    name: 'softycomp',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => data?.paymentMethod === 'softycomp',
      ...groupOverrides?.admin,
    },
    fields: groupOverrides?.fields && typeof groupOverrides?.fields === 'function'
      ? groupOverrides.fields({ defaultFields: baseFields })
      : baseFields,
  }

  return {
    name: 'softycomp',
    label: 'SoftyComp',
    initiatePayment,
    confirmOrder,
    endpoints: [softyCompCallbackEndpoint],
    group: groupField,
  }
}

export * from './callback'
