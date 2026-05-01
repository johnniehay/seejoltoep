import { ComponentConfig, PuckComponent } from '@puckeditor/core'
import {
  createMediaField,
  createBackgroundField,
  createPaddingField,
  createDimensionsField,
} from '@delmaredigital/payload-puck/fields'
import { ShopProductsDisplay, ShopProps } from "@/puck/components/Shop/index";
import { ProductGridItem } from "@/components/ProductGridItem";
import { Grid } from "@/components/Grid";
import React, { useEffect, useState } from "react";
import { getClientSideURL } from "@/utilities/getURL";
import { Product } from "@/payload-types";

// const ShopPuckComponentClient: PuckComponent<ShopProps> = ({ ShopId }: ShopProps) => {
//   return (<ShopPuckComponentAsyncClient ShopId={ShopId} />)
// }

const ShopPuckComponentClient: PuckComponent<ShopProps> = ({ q, sort, category, ...restShopProps}: ShopProps) =>  {
  const [products, setProducts] = useState<{docs?: Product[]} | null>(null);

  useEffect(() => {
    const qq = q ? `where[or][0][title][like]=${q}&where[or][1][description][like]=${q}` : ''
    fetch(`${getClientSideURL()}/api/products?where[categories][contains]=${category}${sort?"&sort=":''}${sort}&${qq}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      });
  }, [q, sort, category]); // Empty dependency array means this runs once on mount

  return (<ShopProductsDisplay products={products} {...restShopProps}/>)
}

export const ShopConfig: ComponentConfig<ShopProps> = {
  label: 'Shop',
  fields: {
    q: {
      type: "text",
      label: "Search Value",
    },
    sort: {
      type: "text",
      label: "Sort"
    },
    category: {
      type: "text",
      label: "Category"
    },
    columns: {
      type: "number",
      label: "Columns"
    },
    smcolumns: {
      type: "number",
      label: "Small Columns"
    },
    lgcolumns: {
      type: "number",
      label: "Large Columns"
    }
  },

  // render:() => (<div>Placeholder</div>)
  render: ShopPuckComponentClient
  // render: ShopPuckComponent
}
