import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && router.pathname !== "/") {
      router.push("/");
    } else {
      setAuthenticated(!!token);
    }
  }, [router]);

  return { authenticated, setAuthenticated };
}
