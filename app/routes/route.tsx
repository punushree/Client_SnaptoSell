import type { MetaArgs } from "react-router";
import HeroSection from "~/components/HeroSection";

export function meta({}: MetaArgs) {
  return [
    { title: "SnapToSell" },
    { name: "description", content: "" },
  ];
}

export default function Home() {
  return <><HeroSection/></>;
}
