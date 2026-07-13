import { Font, Image, Text, View } from "@react-pdf/renderer";
import type { Lede } from "@/payload-types";
import { Style } from "@react-pdf/stylesheet";

Font.register({family:"OpenSans", src:"./public/OpenSans-Medium.ttf", fontWeight: "medium"})
Font.register({family:"OpenSans-Bold", src:"./public/OpenSans-Bold.ttf", fontWeight: "bold"})
Font.register({family:"GreatVibes", src:"./public/GreatVibes-Regular.ttf", fontWeight: "medium"})
Font.register({family:"CinzelDecorative-Bold", src:"./public/CinzelDecorative-Bold.ttf", fontWeight: "bold"})
Font.register({family:"Marcellus", src:"./public/Marcellus-Regular.ttf", fontWeight: "medium"})

function cleanAndExtractSpesialisasies(in_spesialisasies: string[]): string[] {
  return in_spesialisasies.flatMap(item => {
    // 1. Clean up redundant leading commas or whitespace from the string
    const cleanedItem = item.replace(/^[\s,]+/, '').trim();

    // 2. Skip empty strings if any
    if (!cleanedItem) return [];

    // 3. Split by either a comma or the word ' en ' (with surrounding spaces)
    // Regex: /,\s*|\s+en\s+/
    return cleanedItem.split(/,\s*|\s+en\s+/);
  })
    // 4. Final pass to trim whitespace and filter out any accidental empty strings
    .map(str => str.trim())
    .filter(str => str.length > 0);
}

export const LidSertifikaatPDFView = ({lid:inlid}: {lid:Lede} ) => {
  const positionOffsets = [{top:"0",  left:"0",  height:"100%", width:"100%"}]
  const commmonTextStyles: Style = {position:"absolute", width: "100%", minHeight: "1cm", textAlign:"center", fontFamily:"OpenSans" , fontWeight: "medium", color: "#05527a"}
  const txtdbg = false
  // const personjson = (inperson.special_needs && inperson.special_needs.startsWith('{')) ? JSON.parse(inperson.special_needs) : {}
  // const personteamname = "roleAugment" in personjson ? (personjson as PersonAugment).roleAugment : inperson.role === 'day_visitor' ? "Day Visitor" : ""
  // if (personteamname !== "") console.log("personteamname",personteamname)
  // const augmentedteam = (!!inperson.team && typeof inperson.team !== "string" && personteamname === "") ? inperson.team : { name: personteamname, number: ''   }
  // const person = {...inperson, team: augmentedteam}
  const lid = {...inlid}
  if (!lid.divisie) return <></>
  if (typeof lid.divisie === 'string') throw "LidSertifikaatPDFView input lid divisie not expanded"
  const spesialisasies = cleanAndExtractSpesialisasies(lid.divisie.spesialisasies).join(',\n').toUpperCase()
  // const spesialisasies = ["Selfbehoud", "Voetslaner", "Dienaar-leier"].join(',\n').toUpperCase()
  return (
    // (!!person.team && typeof person.team !== "string" && person.team.name.length > 0 ) &&
    <View style={{position:"absolute", ...positionOffsets[0]}} wrap={false} >
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={"./public/Sertifikate2026.jpg"} style={{position:"absolute", width:"100%", height:"100%"}}/>
      <Text debug={txtdbg} style={{...commmonTextStyles,top:"6.5cm",left: "0", fontFamily:"GreatVibes", fontSize:"41.4pt"}} hyphenationCallback={w => [w]}>{lid.vertoonnaam}</Text>
      <Text debug={txtdbg} style={{...commmonTextStyles,top:"8.52cm",left: "11.44cm", width: "25%", fontFamily:"CinzelDecorative-Bold", fontWeight:"bold", fontSize: "19.7pt" }} hyphenationCallback={w => [w]}>{lid.divisie.naam.toUpperCase()}</Text>
      <View debug={txtdbg} style={{...commmonTextStyles, top:"10.52cm", height: "2.42cm", display: "flex", justifyContent: "center"}}>
        <Text debug={txtdbg} style={{...commmonTextStyles,position: "relative", fontFamily:"Marcellus", fontSize: "16.9pt" }} hyphenationCallback={w => [w]}>{spesialisasies}</Text>
      </View>
    </View>
  )}



