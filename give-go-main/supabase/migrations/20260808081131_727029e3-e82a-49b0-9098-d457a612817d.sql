REVOKE EXECUTE ON FUNCTION public.get_donor_leaderboard(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_donor_leaderboard(text) TO authenticated;