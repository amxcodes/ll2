// app/index.tsx
import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/Auth");
    }, 100); 

    return () => clearTimeout(timeout);
  }, [router]);

  return null; 
}
