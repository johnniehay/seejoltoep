'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Inklokke, Presensie } from '@/payload-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { IconMapPin, IconNotes } from '@tabler/icons-react';
import { fetchDashboardData } from '@/lib/inklok'; // Import the new server action

interface DashboardClientProps {
  initialPresensie: Presensie;
  initialInklokke: Inklokke[];
  presensieId: string; // Pass presensieId for polling
}

export default function DashboardClient({ initialPresensie, initialInklokke, presensieId }: DashboardClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [presensie, setPresensie] = useState<Presensie>(initialPresensie);
  const [inklokke, setInklokke] = useState<Inklokke[]>(initialInklokke);
  const [error, setError] = useState<string | null>(null);

  // Effect for dynamically loading Leaflet CSS and JS
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.body.removeChild(script);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Function to fetch updated data
  const refreshData = useCallback(async () => {
    const result = await fetchDashboardData(presensieId);
    if (result.error) {
      setError(result.error);
    } else if (result.presensie && result.inklokke) {
      setPresensie(result.presensie);
      setInklokke(result.inklokke);
      setError(null);
    }
  }, [presensieId]);

  // Effect for polling data
  useEffect(() => {
    refreshData(); // Initial fetch
    const timer = setInterval(refreshData, 15000); // Poll every 15 seconds
    return () => clearInterval(timer); // Cleanup on unmount
  }, [refreshData]);

  // Effect for Leaflet map initialization and updates
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;

    const L = (window as any).L;

    if (mapRef.current && !leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current).setView([-33.9249, 18.4241], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMapRef.current);

      // Fix for default icon issue
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    }

    const map = leafletMapRef.current;
    if (map) {
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      const gpsInklokke = inklokke.filter(i => i.gps && i.gps.length === 2);
      if (gpsInklokke.length > 0) {
        const markers: any[] = [];
        gpsInklokke.forEach(inklok => {
          const [longitude, latitude] = inklok.gps as [number, number];
          const lidName = (typeof inklok.lid === 'object' && inklok.lid !== null) ? `${inklok.lid.naam} ${inklok.lid.van}` : 'Onbekend Lid';
          const scanTime = inklok.scan_time ? format(new Date(inklok.scan_time), 'yyyy-MM-dd HH:mm:ss') : 'Onbekend Tyd';
          const ingestuurDeur = typeof inklok.ingestuur_deur === 'object' ? inklok.ingestuur_deur.email : 'Onbekend Gebruiker';

          const marker = L.marker([latitude, longitude])
            .bindPopup(`
              <b>${lidName}</b><br/>
              Tipe: ${inklok.tipe}<br/>
              Tyd: ${scanTime}<br/>
              Ingestuur deur: ${ingestuurDeur}<br/>
              ${inklok.notes ? `Notas: ${inklok.notes}` : ''}
            `);
          markers.push(marker);
          marker.addTo(map);
        });

        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds());
      }
    }
  }, [inklokke, leafletLoaded]);

  if (error) {
    return <div className="container mx-auto py-10 text-red-500">Fout: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard vir {presensie.naam}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Map Section */}
        <div>
          <Card className="h-[500px]">
            <CardHeader>
              <CardTitle>Inklok Ligging</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <div ref={mapRef} className="h-full w-full rounded-md" />
            </CardContent>
          </Card>
        </div>

        {/* Inklokke List Section */}
        <div>
          <Card className="h-[500px] overflow-y-auto">
            <CardHeader>
              <CardTitle>Alle Inklokke</CardTitle>
            </CardHeader>
            <CardContent>
              {inklokke.length > 0 ? (
                <ul className="space-y-4">
                  {inklokke.map((inklok) => {
                    const lidName = (typeof inklok.lid === 'object' && inklok.lid !== null) ? `${inklok.lid.naam} ${inklok.lid.van}` : 'Onbekend Lid';
                    const scanTime = inklok.scan_time ? format(new Date(inklok.scan_time), 'yyyy-MM-dd HH:mm:ss') : 'Onbekend Tyd';
                    const ingestuurDeur = typeof inklok.ingestuur_deur === 'object' ? inklok.ingestuur_deur.email : 'Onbekend Gebruiker';

                    return (
                      <li key={inklok.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <p className="text-lg font-semibold">{lidName} - {inklok.tipe === 'in' ? 'Ingeklok' : 'Uitgeklok'}</p>
                        <p className="text-sm text-muted-foreground">Tyd: {scanTime}</p>
                        <p className="text-sm text-muted-foreground">Ingestuur deur: {ingestuurDeur}</p>
                        {inklok.gps && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <IconMapPin size={16} /> GPS: {inklok.gps[1]}, {inklok.gps[0]}
                          </p>
                        )}
                        {inklok.notes && (
                          <p className="text-sm text-muted-foreground flex items-start gap-1">
                            <IconNotes size={16} className="mt-1" /> Notas: {inklok.notes}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">Geen inklokke gevind vir hierdie presensie nie.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
