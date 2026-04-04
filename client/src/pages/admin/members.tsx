import { useState } from "react";
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember, useCreatePayment } from "@/hooks/use-members";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Pencil, Trash, MessageCircle, CreditCard, Shield } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/layout-admin";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Member } from "@shared/schema";

const MEMBERSHIP_LABELS: Record<string, string> = { sessions: "Sesiones", monthly: "Mensual", unlimited: "Ilimitada" };

function MembershipBadge({ type }: { type: string }) {
  const colors: Record<string, string> = { sessions: "bg-blue-500/10 text-blue-400", monthly: "bg-purple-500/10 text-purple-400", unlimited: "bg-yellow-500/10 text-yellow-400" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || colors.sessions}`}>{MEMBERSHIP_LABELS[type] || type}</span>;
}

function SessionsBadge({ n, isUnlimited }: { n: number; isUnlimited: boolean }) {
  if (isUnlimited) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">∞</span>;
  const color = n === 0 ? "bg-red-500/10 text-red-400" : n === 1 ? "bg-orange-500/10 text-orange-400" : "bg-green-500/10 text-green-400";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{n}</span>;
}

function AddMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateMember();
  const [form, setForm] = useState({ firstName: "", lastName: "", memberId: "", email: "", phone: "", initialSessions: 0, membershipType: "sessions", birthDate: "", notes: "" });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ ...form, active: true, initialSessions: Number(form.initialSessions) || 0 }, { onSuccess: () => { onOpenChange(false); setForm({ firstName: "", lastName: "", memberId: "", email: "", phone: "", initialSessions: 0, membershipType: "sessions", birthDate: "", notes: "" }); } });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Agregar Nuevo Miembro</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>ID de Miembro <span className="text-primary text-xs">(requerido)</span></Label>
            <Input value={form.memberId} onChange={e => set("memberId", e.target.value)} placeholder="Ej: 1003" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nombre</Label><Input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Opcional" /></div>
            <div className="space-y-1"><Label>Apellido</Label><Input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Opcional" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Teléfono</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Opcional" /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="Opcional" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Tipo de Membresía</Label>
              <Select value={form.membershipType} onValueChange={v => set("membershipType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="sessions">Sesiones</SelectItem><SelectItem value="monthly">Mensual</SelectItem><SelectItem value="unlimited">Ilimitada</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Sesiones Iniciales</Label><Input type="number" value={form.initialSessions} onChange={e => set("initialSessions", e.target.value)} placeholder="0" /></div>
          </div>
          <div className="space-y-1"><Label>Fecha de Nacimiento</Label><Input type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} /></div>
          <div className="space-y-1"><Label>Notas</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Opcional" /></div>
          <DialogFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Creando..." : "Crear Miembro"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditMemberDialog({ member, open, onOpenChange }: { member: Member; open: boolean; onOpenChange: (v: boolean) => void }) {
  const update = useUpdateMember();
  const [form, setForm] = useState({
    firstName: member.firstName, lastName: member.lastName, memberId: member.memberId,
    email: member.email || "", phone: member.phone || "", membershipType: member.membershipType || "sessions",
    birthDate: member.birthDate || "", notes: member.notes || "", active: member.active,
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate({ id: member.id, ...form }, { onSuccess: () => onOpenChange(false) });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Miembro — {member.firstName} {member.lastName}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Nombre</Label><Input value={form.firstName} onChange={e => set("firstName", e.target.value)} /></div>
            <div className="space-y-1"><Label>Apellido</Label><Input value={form.lastName} onChange={e => set("lastName", e.target.value)} /></div>
          </div>
          {!member.isSpecialUser && <div className="space-y-1"><Label>ID de Miembro</Label><Input value={form.memberId} onChange={e => set("memberId", e.target.value)} /></div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Teléfono</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
          </div>
          {!member.isSpecialUser && (
            <div className="space-y-1"><Label>Tipo de Membresía</Label>
              <Select value={form.membershipType} onValueChange={v => set("membershipType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="sessions">Sesiones</SelectItem><SelectItem value="monthly">Mensual</SelectItem><SelectItem value="unlimited">Ilimitada</SelectItem></SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1"><Label>Fecha de Nacimiento</Label><Input type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} /></div>
          <div className="space-y-1"><Label>Notas internas</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
          <DialogFooter><Button type="submit" disabled={update.isPending}>{update.isPending ? "Guardando..." : "Guardar Cambios"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentDialog({ member, open, onOpenChange }: { member: Member; open: boolean; onOpenChange: (v: boolean) => void }) {
  const createPayment = useCreatePayment();
  const [form, setForm] = useState({ amount: "", paymentMethod: "Efectivo", sessions: "", note: "" });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPayment.mutate({
      memberId: member.id, amount: Number(form.amount),
      paymentMethod: form.paymentMethod as any,
      sessions: form.sessions ? Number(form.sessions) : undefined,
      note: form.note || undefined,
    }, { onSuccess: () => { onOpenChange(false); setForm({ amount: "", paymentMethod: "Efectivo", sessions: "", note: "" }); } });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader><DialogTitle>Registrar Pago — {member.firstName}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1"><Label>Monto (MXN)</Label><Input type="number" placeholder="0" value={form.amount} onChange={e => set("amount", e.target.value)} required /></div>
          <div className="space-y-1"><Label>Método de Pago</Label>
            <Select value={form.paymentMethod} onValueChange={v => set("paymentMethod", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Efectivo", "Transferencia", "Tarjeta", "Terminal"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {member.membershipType === "sessions" && (
            <div className="space-y-1"><Label>Sesiones compradas (opcional)</Label><Input type="number" placeholder="10" value={form.sessions} onChange={e => set("sessions", e.target.value)} /></div>
          )}
          <div className="space-y-1"><Label>Nota (opcional)</Label><Input value={form.note} onChange={e => set("note", e.target.value)} /></div>
          <DialogFooter><Button type="submit" disabled={createPayment.isPending}>{createPayment.isPending ? "Registrando..." : "Registrar Pago"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function sendWhatsApp(member: Member) {
  if (!member.phone) return;
  const phone = member.phone.replace(/\D/g, "");
  let msg = "";
  if (member.remainingSessions === 1) {
    msg = `Hola ${member.firstName} 👋 Te recordamos que te queda *1 sola sesión* en Asgard Gym. ¡Renueva hoy para seguir entrenando sin interrupciones! 💪`;
  } else if (member.membershipType === "monthly" && member.expiresAt) {
    const fecha = format(new Date(member.expiresAt), "d 'de' MMMM", { locale: es });
    msg = `Hola ${member.firstName} 👋 Tu membresía en Asgard Gym vence el *${fecha}*. ¡Renuévala para no perder tu continuidad! 💪`;
  }
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
}

function needsWhatsApp(m: Member) {
  if (m.remainingSessions === 1 && m.membershipType === "sessions") return true;
  if (m.membershipType === "monthly" && m.expiresAt) {
    const diff = (new Date(m.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff <= 3 && diff >= 0) return true;
  }
  return false;
}

export default function MembersPage() {
  const { data: members, isLoading } = useMembers();
  const deleteMember = useDeleteMember();
  const [search, setSearch] = useState("");
  const [showSpecial, setShowSpecial] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const specialMembers = members?.filter(m => m.isSpecialUser) || [];
  const regularMembers = members?.filter(m => !m.isSpecialUser) || [];

  const filtered = (showSpecial ? specialMembers : regularMembers).filter(m =>
    `${m.firstName} ${m.lastName} ${m.memberId}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (confirm("¿Eliminar este miembro?")) deleteMember.mutate(id);
  };

  const openEdit = (m: Member) => { setSelectedMember(m); setIsEditOpen(true); };
  const openPayment = (m: Member) => { setSelectedMember(m); setIsPaymentOpen(true); };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Miembros</h1>
          <p className="text-muted-foreground mt-1">Gestionar membresías y sesiones.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Agregar Miembro</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        <Button variant={showSpecial ? "ghost" : "default"} size="sm" onClick={() => setShowSpecial(false)}>
          Miembros ({regularMembers.length})
        </Button>
        <Button variant={showSpecial ? "default" : "ghost"} size="sm" onClick={() => setShowSpecial(true)}>
          <Shield className="mr-1 h-3 w-3" /> Equipo Asgard ({specialMembers.length})
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Membresía</TableHead>
                {!showSpecial && <TableHead>Sesiones</TableHead>}
                <TableHead className="hidden lg:table-cell">Último Pago</TableHead>
                <TableHead className="hidden md:table-cell">Contacto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10"><div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" /></div></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No se encontraron miembros.</TableCell></TableRow>
              ) : filtered.map(member => (
                <TableRow key={member.id} className="border-border hover:bg-secondary/20">
                  <TableCell className="font-mono text-sm">{member.memberId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.firstName} {member.lastName}</span>
                      {member.isSpecialUser && <Shield className="h-3 w-3 text-yellow-400" />}
                    </div>
                  </TableCell>
                  <TableCell><MembershipBadge type={member.membershipType || "sessions"} /></TableCell>
                  {!showSpecial && (
                    <TableCell><SessionsBadge n={member.remainingSessions} isUnlimited={member.isSpecialUser || member.membershipType === "unlimited"} /></TableCell>
                  )}
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                    {member.lastPaymentDate ? format(new Date(member.lastPaymentDate), "d MMM yyyy", { locale: es }) : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{member.phone || member.email || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {needsWhatsApp(member) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-400" onClick={() => sendWhatsApp(member)} title="Enviar recordatorio">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openEdit(member)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          {!member.isSpecialUser && (
                            <DropdownMenuItem onClick={() => openPayment(member)}><CreditCard className="mr-2 h-4 w-4" />Registrar Pago</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(member.id)}><Trash className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <AddMemberDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      {selectedMember && (
        <>
          <EditMemberDialog member={selectedMember} open={isEditOpen} onOpenChange={setIsEditOpen} />
          <PaymentDialog member={selectedMember} open={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
        </>
      )}
    </AdminLayout>
  );
}
