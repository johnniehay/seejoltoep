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

import { Grid } from "@/components/Grid";
import { ProductGridItem } from "@/components/ProductGridItem";
import React from "react";

import type { Product } from "@/payload-types";
import type { PaginatedDocs } from "payload";

export type ShopProps = {
  q?: string,
  sort?: string,
  category?: string,
  columns?: number,
  smcolumns?: number
  lgcolumns?: number
}

export type QueriedProducts = PaginatedDocs<Partial<Product>> | null


export const ShopProductsDisplay = ({columns,smcolumns,lgcolumns,products}:ShopProps & {products: Partial<QueriedProducts>}) => {
  return ((products && (<Grid className={`grid grid-cols-${columns??1} sm:grid-cols-${smcolumns??2} lg:grid-cols-${lgcolumns??3} gap-6`}>
    {products.docs?.map((product) => {
      return <ProductGridItem key={product.id} product={product} />
    })}
  </Grid>)) || (<div>Loading...</div>))
}





