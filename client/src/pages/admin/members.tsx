import { useState } from "react";
import { useMembers, useCreateMember, useUpdateMember, useAddSessions, useDeleteMember } from "@/hooks/use-members";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, MoreHorizontal, Pencil, Trash, UserPlus } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import AdminLayout from "@/components/layout-admin";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMemberSchema } from "@shared/schema";
import type { InsertMember } from "@shared/schema";
import { z } from "zod";

// === Add Member Dialog ===
function AddMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMember = useCreateMember();
  const form = useForm<InsertMember>({
    resolver: zodResolver(insertMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      memberId: "",
      email: "",
      phone: "",
      initialSessions: 10,
    },
  });

  const onSubmit = (data: InsertMember) => {
    createMember.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display">Agregar Nuevo Miembro</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" {...form.register("firstName")} />
              {form.formState.errors.firstName && <span className="text-xs text-red-500">{form.formState.errors.firstName.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" {...form.register("lastName")} />
              {form.formState.errors.lastName && <span className="text-xs text-red-500">{form.formState.errors.lastName.message}</span>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberId">ID de Miembro (Único)</Label>
            <Input id="memberId" placeholder="Teléfono o ID personalizado" {...form.register("memberId")} />
            {form.formState.errors.memberId && <span className="text-xs text-red-500">{form.formState.errors.memberId.message}</span>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialSessions">Sesiones Iniciales</Label>
            <Input 
              id="initialSessions" 
              type="number" 
              {...form.register("initialSessions", { valueAsNumber: true })} 
            />
            {form.formState.errors.initialSessions && <span className="text-xs text-red-500">{form.formState.errors.initialSessions.message}</span>}
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={createMember.isPending}>
              {createMember.isPending ? "Creando..." : "Crear Miembro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// === Edit Member Dialog ===
function EditMemberDialog({ member, open, onOpenChange }: { member: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const updateMember = useUpdateMember();
  const form = useForm<InsertMember>({
    resolver: zodResolver(insertMemberSchema),
    defaultValues: {
      firstName: member.firstName,
      lastName: member.lastName,
      memberId: member.memberId,
      email: member.email || "",
      phone: member.phone || "",
    },
  });

  const onSubmit = (data: InsertMember) => {
    updateMember.mutate({ id: member.id, ...data }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Editar Miembro</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">Nombre</Label>
              <Input id="edit-firstName" {...form.register("firstName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Apellido</Label>
              <Input id="edit-lastName" {...form.register("lastName")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-memberId">ID de Miembro</Label>
            <Input id="edit-memberId" {...form.register("memberId")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" {...form.register("email")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input id="edit-phone" {...form.register("phone")} />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={updateMember.isPending}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// === Add Sessions Dialog ===
function AddSessionsDialog({ member, open, onOpenChange }: { member: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const addSessions = useAddSessions();
  const [sessions, setSessions] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSessions.mutate({ id: member.id, sessions }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Agregar Sesiones</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="p-4 bg-secondary/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Saldo Actual</p>
            <p className="text-3xl font-bold text-white">{member.remainingSessions}</p>
          </div>
          
          <div className="space-y-4">
            <Label>Sesiones a Agregar</Label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 10, 20].map((num) => (
                <div 
                  key={num}
                  onClick={() => setSessions(num)}
                  className={`
                    cursor-pointer p-4 rounded-xl border text-center transition-all
                    ${sessions === num 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border bg-background hover:bg-secondary'}
                  `}
                >
                  <span className="font-bold text-lg">+{num}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <Input 
                type="number" 
                value={sessions} 
                onChange={(e) => setSessions(parseInt(e.target.value) || 0)}
                className="text-center font-mono text-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={addSessions.isPending}>
              {addSessions.isPending ? "Agregando..." : "Confirmar Compra"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MembersPage() {
  const { data: members, isLoading } = useMembers();
  const deleteMember = useDeleteMember();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Edit/Add Sessions State
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  const filteredMembers = members?.filter(m => 
    m.firstName.toLowerCase().includes(search.toLowerCase()) ||
    m.lastName.toLowerCase().includes(search.toLowerCase()) ||
    m.memberId.includes(search)
  );

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar a este miembro?")) {
      deleteMember.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Miembros</h1>
          <p className="text-muted-foreground mt-1">Gestionar membresías y sesiones del gimnasio.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Agregar Miembro
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>ID Miembro</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Sesiones Restantes</TableHead>
                <TableHead className="hidden md:table-cell">Total Comprado</TableHead>
                <TableHead className="hidden md:table-cell">Contacto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMembers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No se encontraron miembros.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers?.map((member) => (
                  <TableRow key={member.id} className="border-border hover:bg-secondary/20">
                    <TableCell className="font-mono text-sm">{member.memberId}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.remainingSessions > 3 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {member.remainingSessions}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{member.totalSessions}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {member.phone || member.email || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsSessionsOpen(true); }}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Agregar Sesiones
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsEditOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Eliminar Miembro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>


      <AddMemberDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      
      {selectedMember && (
        <>
          <EditMemberDialog 
            member={selectedMember} 
            open={isEditOpen} 
            onOpenChange={setIsEditOpen} 
          />
          <AddSessionsDialog 
            member={selectedMember} 
            open={isSessionsOpen} 
            onOpenChange={setIsSessionsOpen} 
          />
        </>
      )}
    </AdminLayout>
  );
}
