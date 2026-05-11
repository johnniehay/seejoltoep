import React, { CSSProperties } from 'react';
import { getPayload } from 'payload';
import config from '@payload-config';
import { notFound } from 'next/navigation';
import { Media as MediaType } from '@/payload-types'; // Renamed to avoid conflict with component
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Gallery } from "@/components/product/Gallery";
import { Media } from '@/components/Media'; // Import the Media component

import { parseISO, format, isToday } from 'date-fns';
import RichText from "@/components/RichText";
import { Checkbox } from '@/components/ui/checkbox';
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

export default async function DivisiePage({ params }: { params: Promise<{ divisie: string }> }) {
  const payload = await getPayload({ config });
  const { divisie } = await params
  const divisieData = await payload.find({
    collection: 'divisie',
    where: {
      id: {
        equals: divisie,
      },
    },
    depth: 2, // Fetch related data like media, lede, and aktiwiteite
  });

  if (!divisieData.docs[0]) {
    notFound();
  }

  const data = divisieData.docs[0];
  const heroImage = data.hero_image as MediaType;

  const self_lid = (await auth())?.user?.self_lid
  const isDivisieLeier = (Boolean(self_lid) && data.divisieleier?.docs?.some((d) => (
    (typeof d === 'string'?d:d.id) === (typeof self_lid === 'string' ? self_lid : self_lid?.id)))) ?? false
  const canUpdateDivisie = isDivisieLeier || await hasPermission("update:divisie")

  // Extract program items from aktiwiteite join field
  const programItems = (data.aktiwiteite)?.docs?.filter((aktiwiteit) => typeof aktiwiteit !== 'string').
      toSorted((a,b) => parseISO(a.begin).getTime() - parseISO(b.begin).getTime()).
      map((aktiwiteit) => ({
    begin: format(parseISO(aktiwiteit.begin),'d MMM HH:mm'),
    einde: format(parseISO(aktiwiteit.einde),parseISO(aktiwiteit.begin).toDateString() !== parseISO(aktiwiteit.einde).toDateString() ?'d MMM HH:mm': 'HH:mm'),
    description: aktiwiteit.title,
  })) || [];

  return (
    <div className={`min-h-screen bg-slate-50`} style={{"--divisie-color":data.kleur} as CSSProperties}>
      {/* 1. Hero Section */}
      <section className="relative min-h-32 bg-cover bg-center shadow-lg"
        style={{ backgroundImage: heroImage ? `url(${heroImage.url})` : 'url(/placeholder-hero.jpg)' }}>
        <div className="inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-white p-4">
          <h1 className="text-3xl text-center font-bold mb-1">{data.naam} Divisie</h1>
          {data.kort_sin && <p className="text-lg text-center mb-1">{data.kort_sin}</p>}
          {data.hero_button_text && data.hero_button_link && (
            <Button asChild className="h-9 px-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
              <Link href={data.hero_button_link}>
                {data.hero_button_text}
              </Link>
            </Button>
          )}
        </div>
      </section>

      <div className="container mx-auto py-4 px-4 flex flex-col items-center gap-2 relative z-10">
        {canUpdateDivisie && <section className="w-full max-w-4xl p-6 bg-background rounded-xl shadow-md border-[var(--divisie-color)] border-t-4 border-l-4">
          <h2 className="text-2xl font-semibold mb-4">DivisieLeier Administrasie</h2>
          <Button asChild className="h-9 px-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
            <Link href={`/admin/collections/divisie/${data.id}`}>
              Verander Diviesieblad
            </Link>
          </Button>
        </section>}
        {/* 2. Wat is this division? */}
        {data.beskrywing && <section className="w-full max-w-4xl p-6 bg-background rounded-xl shadow-md border-[var(--divisie-color)] border-t-4 border-l-4">
          <h2 className="text-2xl font-semibold mb-4">Wat is {data.naam}?</h2>
          <RichText data={data.beskrywing} enableGutter={false}/>
        </section>}

        {/* 3. Divisie-inligting (Cards) */}
        <section className="w-full max-w-4xl">
          <div className="flex flex-wrap gap-2">
            <div className="bg-background p-6 rounded-xl shadow-md flex-grow border-[var(--divisie-color)] border-t-4 border-l-4">
              <h3 className="text-l font-bold mb-2">Divisieleier</h3>
              <p>{(data.divisieleier as any)?.docs?.[0]?.vertoonnaam || 'N/A'}</p>
              {data.kontak && <p>{(data.kontak || '')}</p>}
            </div>
            {data.grade.length > 0 && <div className="bg-background p-6 rounded-xl shadow-md flex-grow border-[var(--divisie-color)] border-t-4 border-l-4">
              <h3 className="text-l font-bold mb-2">Grade</h3>
              <p>{data.grade?.join(', ')}</p>
            </div>}
            {data.whatsapp_link && <div className="bg-background p-6 rounded-xl shadow-md flex-grow border-[var(--divisie-color)] border-t-4 border-l-4">
              <h3 className="text-l font-bold mb-2">Whatsapp</h3>
              <Link href={data.whatsapp_link} className="underline">
                {data.naam} Divisie Whatsapp
              </Link>
            </div>}
            {data.spesialisasies.length > 0 && <div className="bg-background p-6 rounded-xl shadow-md flex-grow border-[var(--divisie-color)] border-t-4 border-l-4">
              <h3 className="text-l font-bold mb-2">Spesialisasies</h3>
              <p>{data.spesialisasies?.join(', ')}</p>
            </div>}
            <div className="bg-background p-6 rounded-xl shadow-md flex-grow border-[var(--divisie-color)] border-t-4 border-l-4">
              <h3 className="text-l font-bold mb-2">Aktiwiteite</h3>
              {data.aktiwiteite_beskrywing && <RichText data={data.aktiwiteite_beskrywing}/>}
            </div>
            <div className="bg-background p-6 rounded-xl shadow-md flex-grow border-[var(--divisie-color)] border-t-4 border-l-4">
              <h3 className="text-l font-bold mb-2">Wat om saam te bring</h3>
              {data.wat_om_saam_te_bring && <RichText data={data.wat_om_saam_te_bring}/>}
            </div>
          </div>
        </section>

        {/* 4. Program / Volgende aktiwiteit (using aktiwiteite join field) */}
        {programItems.length > 0 && (
          <section className="w-full max-w-4xl p-6 bg-background rounded-xl shadow-md border-[var(--divisie-color)] border-t-4 border-l-4">
            <h2 className="text-2xl font-semibold mb-4">Program</h2>
            <div className="flex flex-col gap-4">
              {programItems.map((item, index: number) => (
                <div key={index} className="flex bg-secondary rounded-lg shadow-sm justify-between items-center p-1 px-2">
                  <p className="text-sm text-gray-600 flex-grow">{item.begin} - {item.einde}</p>
                  <p className="text-lg font-semibold text-right flex-grow">{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Belangrike dokumente */}
        {data.dokumente && data.dokumente.length > 0 && (
          <section className="w-full max-w-4xl p-6 bg-background rounded-xl shadow-md border-[var(--divisie-color)] border-t-4 border-l-4">
            <h2 className="text-2xl font-semibold mb-4">Dokumente</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.dokumente.map((doc, index) => (
                <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-sm flex items-center space-x-3">
                  <Media resource={doc.document as MediaType} alt={doc.title ?? (doc.document as MediaType).alt ?? undefined} className="flex items-center w-full"/>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Kennisgewings */}
        {data.kennisgewings_test && data.kennisgewings_test.length > 0 && (
          <section id="kennisgewings" className="w-full max-w-4xl p-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-xl shadow-md  border-t-(--divisie-color) border-t-4">
            <h2 className="text-2xl font-semibold mb-4">Kennisgewings</h2>
            <div className="flex flex-col gap-2">
              {data.kennisgewings_test.map((notice, index) => {
                const noticeDate = parseISO(notice.date);
                const formattedDate = isToday(noticeDate) ? format(noticeDate, 'HH:mm') : format(noticeDate, 'd MMM HH:mm');
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-sm font-semibold text-gray-500 mr-4">{formattedDate}</span>
                    <p className="flex-grow text-gray-800">{notice.notice}</p>
                    <Checkbox className="ml-4" />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 7. Divisie foto / gallery */}
        {data.gallery && data.gallery.length > 0 && <Gallery gallery={data.gallery} initialIndex={-1} className={"flex flex-col-reverse max-w-4xl"}/>}
      </div>
    </div>
  );
}
