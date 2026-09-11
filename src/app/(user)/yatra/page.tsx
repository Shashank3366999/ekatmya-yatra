import type { Metadata } from "next";

import { PageTitle } from "@/components/ui/page-title";
import {
  listHeritagePlaces,
  listJourneyPlaceIds,
  listRoutePlaces,
} from "@/lib/queries";
import { requireUser } from "@/lib/session";

import { YatraExplorer } from "./yatra-explorer";

export const metadata: Metadata = { title: "The Yatra" };

export default async function YatraPage() {
  const user = await requireUser();
  const [route, heritage, journeyIds] = await Promise.all([
    listRoutePlaces(),
    listHeritagePlaces(),
    listJourneyPlaceIds(user.id),
  ]);

  return (
    <div className="space-y-5">
      <PageTitle
        title="The Yatra"
        description="16 January to 10 May 2027, Kalady to Kedarnath — shown against every site Adi Shankaracharya sanctified."
      />
      <YatraExplorer
        heritage={heritage
          .filter((h) => !h.isOnRoute)
          .map((h) => ({
            id: h.id,
            name: h.name,
            latitude: h.latitude,
            longitude: h.longitude,
            stateName: h.stateName,
            significance: h.significance,
            isBeyondReach: h.isBeyondReach,
          }))}
        places={route.map((p) => ({
          id: p.id,
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          routeOrder: p.routeOrder,
          stateName: p.stateName,
          districtName: p.districtName,
          category: p.category,
          significance: p.significance,
          imageUrl: p.imageUrl,
          expectedArrival: p.expectedArrival ? p.expectedArrival.toISOString() : null,
        }))}
        journeyIds={journeyIds}
      />
    </div>
  );
}
