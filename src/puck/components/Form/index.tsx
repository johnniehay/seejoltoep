import { ComponentConfig, PuckComponent, WithId, WithPuckProps } from '@puckeditor/core'
import {
  createMediaField,
  createBackgroundField,
  createPaddingField,
  backgroundValueToCSS,
  paddingValueToCSS,
  createDimensionsField,
  dimensionsValueToCSS, MediaReference, BackgroundValue, PaddingValue, DimensionsValue,
} from '@delmaredigital/payload-puck/fields'
import { FormBlock, FormBlockType } from "@/blocks/Form/Component";
import payloadconfig from "@/payload.config"
import { getPayload } from "payload";

export type FormProps = {
  formId: string,
}

export const FormPuckComponent: PuckComponent<FormProps> = ({ formId }: FormProps) => {

  return (<FormAsyncComponent formId={formId} />)

}

export async function FormAsyncComponent({ formId }: FormProps) {
  const payload = await getPayload({ config: payloadconfig})
  const formdata = await payload.findByID({collection: 'forms', id: formId})

  return (<FormBlock
    form={formdata as FormBlockType['form']}
    enableIntro={false}
  />)
}




