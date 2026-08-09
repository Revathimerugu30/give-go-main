import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to Lovable Cloud realtime (WebSocket) changes on the given tables
 * and invalidates the matching react-query keys so dashboards refresh live.
 */
export function useRealtime(
  channelName: string,
  tables: string[],
  onEvent?: (table: string, payload: unknown) => void,
) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel(channelName);
    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          onEvent?.(table, payload);
          void qc.invalidateQueries();
        },
      );
    });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, qc]);
}
