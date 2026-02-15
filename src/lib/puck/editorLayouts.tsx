import { defaultLayout, fullWidthLayout, landingLayout } from "@/lib/puck/layouts";
import { LayoutDefinition } from "@delmaredigital/payload-puck/layouts";
import { Header } from "@/Header/Component";
import { Footer } from "@/Footer/Component";
import { HeaderClient } from "@/Header/Component.client";
import { partial } from "lodash";

const headerFooter: Pick<LayoutDefinition, "header" | "footer"> = {
  header: partial(HeaderClient,{data:{id:"header"}}),
  // footer: Footer,
}

export const defaultLayoutWithHeaderFooter: LayoutDefinition = {
  ...defaultLayout,
  ...headerFooter,
}

export const fullWidthLayoutWithHeaderFooter: LayoutDefinition = {
  ...fullWidthLayout,
  ...headerFooter,
}

export const landingLayoutWithHeaderFooter: LayoutDefinition = {
  ...landingLayout,
  ...headerFooter,
}


export const puckEditorLayouts: LayoutDefinition[] = [
  defaultLayoutWithHeaderFooter,
  fullWidthLayoutWithHeaderFooter,
  landingLayoutWithHeaderFooter,
]
