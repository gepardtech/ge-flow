import { useEffect, useState } from "react";
import { Building2, Check } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";

const UserBusinesses = () => {
  const { businesses, activeId, setActive, loading } = useActiveBusiness();

  return (
    <UserPanelGate pageTitle="My Businesses">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-1">My Businesses</h1>
        <p className="text-sm text-muted-foreground">Switch between your registered businesses. Inventory and sales are scoped per business.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading...</div>
      ) : businesses.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-bold">No businesses yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((b) => {
            const isActive = b.id === activeId;
            return (
              <button key={b.id} onClick={() => setActive(b.id)} className={`text-left bg-card border rounded-2xl p-5 transition-all hover:shadow-lg ${isActive ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                  {isActive && <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-primary"><Check className="h-3 w-3" /> ACTIVE</span>}
                </div>
                <p className="font-bold">{b.business_name}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{b.status} • {b.currency}</p>
              </button>
            );
          })}
        </div>
      )}
    </UserPanelGate>
  );
};

export default UserBusinesses;
