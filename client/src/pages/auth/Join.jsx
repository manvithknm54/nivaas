import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import AuthShell from "../../components/layout/AuthShell";
import Spinner from "../../components/ui/Spinner";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/axios";

export default function Join() {
  const { token } = useParams();
  const { user, loading, refresh } = useAuth();
  const nav = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["join", token],
    queryFn: async () => (await api.get(`/join/${token}`)).data,
  });
  const send = useMutation({
    mutationFn: () => api.post(`/join/${token}`),
    onSuccess: async () => { toast.success("Request sent to the owner"); await refresh(); nav("/app"); },
    onError: (e) => toast.error(e.message),
  });

  if (loading || isLoading) return <Spinner />;
  if (isError) return <AuthShell title="Invalid invite" subtitle={error.message} />;

  const next = encodeURIComponent(`/join/${token}`);
  return (
    <AuthShell title={`Join ${data.name}`} subtitle={data.address || "Your PG owner has invited you."}>
      {!user && (
        <div className="space-y-3">
          <Link className="btn-gold w-full" to={`/register?next=${next}`}>Create account and join</Link>
          <Link className="btn-ghost w-full" to={`/login?next=${next}`}>I already have an account</Link>
        </div>
      )}
      {user?.role === "owner" && <p className="text-ink-900/60">You're logged in as an owner. Open this link with a tenant account.</p>}
      {user?.role === "tenant" && (
        <button className="btn-gold w-full" disabled={send.isPending} onClick={() => send.mutate()}>
          {send.isPending ? "Sending…" : "Request to join"}
        </button>
      )}
    </AuthShell>
  );
}