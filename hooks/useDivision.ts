import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { usePermissions } from "./usePermissions";
import { Database } from "@/types/supabase";

type Division = Database["public"]["Tables"]["divisions"]["Row"];
type Member = Database["public"]["Tables"]["members"]["Row"];

export function useDivision() {
  const { member } = useAuth();
  const { isDivisionAdmin, isUnionAdmin, isApplicationAdmin } = usePermissions();
  const [division, setDivision] = useState<Division | null>(null);
  const [divisionMembers, setDivisionMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!member?.division_id) {
      setIsLoading(false);
      return;
    }

    const divisionId = member.division_id;

    async function fetchDivisionData() {
      try {
        // Fetch division details
        const { data: divisionData, error: divisionError } = await supabase
          .from("divisions")
          .select("*")
          .eq("id", divisionId)
          .single();

        if (divisionError) throw divisionError;
        setDivision(divisionData);

        // Fetch division members
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("*")
          .eq("division_id", divisionId)
          .eq("is_active", true);

        if (membersError) throw membersError;
        setDivisionMembers(membersData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch division data"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchDivisionData();
  }, [member?.division_id]);

  const canManageDivision = () => {
    if (!member?.division_id) return false;
    return isDivisionAdmin() || isUnionAdmin() || isApplicationAdmin();
  };

  const isMemberOfDivision = (memberId: string) => {
    return divisionMembers.some((m) => m.id === memberId);
  };

  const getDivisionOfficers = () => {
    return divisionMembers.filter((m) => m.officer_position !== null);
  };

  const getDivisionAdmins = () => {
    return divisionMembers.filter((m) => m.role === "division_admin");
  };

  const refreshDivisionData = async () => {
    if (!member?.division_id) {
      setError(new Error("No division ID available"));
      return;
    }

    setIsLoading(true);
    setError(null);

    const divisionId = member.division_id;

    try {
      // Fetch division details
      const { data: divisionData, error: divisionError } = await supabase
        .from("divisions")
        .select("*")
        .eq("id", divisionId)
        .single();

      if (divisionError) throw divisionError;
      setDivision(divisionData);

      // Fetch division members
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .eq("division_id", divisionId)
        .eq("is_active", true);

      if (membersError) throw membersError;
      setDivisionMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to refresh division data"));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    division,
    divisionMembers,
    isLoading,
    error,
    canManageDivision,
    isMemberOfDivision,
    getDivisionOfficers,
    getDivisionAdmins,
    refreshDivisionData,
  };
}
