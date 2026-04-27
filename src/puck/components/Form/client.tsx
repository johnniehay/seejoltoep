import { ComponentConfig, PuckComponent } from '@puckeditor/core'
import {
  createMediaField,
  createBackgroundField,
  createPaddingField,
  createDimensionsField,
} from '@delmaredigital/payload-puck/fields'
import { IframeComponent, IframeProps } from "@/puck/components/Iframe/index";
import { FormProps, FormPuckComponent } from "@/puck/components/Form/index";
import { FormBlock, FormBlockType } from "@/blocks/Form/Component";
import { getClientSideURL } from "@/utilities/getURL";
import { useEffect, useState } from "react";

// const FormPuckComponentClient: PuckComponent<FormProps> = ({ formId }: FormProps) => {
//   return (<FormPuckComponentAsyncClient formId={formId} />)
// }

const FormPuckComponentClient: PuckComponent<FormProps> = ({ formId }: FormProps) =>  {
  const [formdata, setFormData] = useState(null);

  useEffect(() => {
    fetch(`${getClientSideURL()}/api/forms/${formId}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData(data);
      });
  }, []); // Empty dependency array means this runs once on mount

  return ((formdata && (<FormBlock
    form={formdata as FormBlockType['form']}
    enableIntro={false}
  />)) || (<div>Loading...</div>))
}

export const FormConfig: ComponentConfig<FormProps> = {
  label: 'Form',
  fields: {
    formId: {
      type: "text",
      label: "Form ID"
    },
    // formdata: {
    //   type: "external",
    //   fetchList: async () => {
    //
    //   }
    // }
  },

  // render:() => (<div>Placeholder</div>)
  render: FormPuckComponentClient
  // render: FormPuckComponent
}
