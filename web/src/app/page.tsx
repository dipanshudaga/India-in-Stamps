import { WallApp } from "@/components/wall/wall-app";
import { getStamp, parseStampId } from "@/lib/stamps-server";

export default async function Home(props: PageProps<"/">) {
  const params = await props.searchParams;
  const requested = typeof params.s === "string" ? parseStampId(params.s) : undefined;
  const initialStampId = requested !== undefined && getStamp(requested) ? requested : undefined;
  return <WallApp initialStampId={initialStampId} debug={params.debug === "1"} />;
}
