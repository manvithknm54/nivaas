import { useQuery } from "@tanstack/react-query";
import { api } from "./axios";

export const usePg = () =>
  useQuery({
    queryKey: ["pg"],
    queryFn: async () => {
      try {
        return (await api.get("/owner/pg")).data;
      } catch (e) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    },
  });