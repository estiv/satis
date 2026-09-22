import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, Field, Input, PageHeader, Select } from "@/components/ui";
import { FormModal, DeleteButton } from "@/components/modal";
import { deleteUser, saveUser } from "@/modules/users/actions";
import { ROLES } from "@/core/labels";

function UserFields({
  user,
}: {
  user?: { name: string; email: string; role: string; active: boolean };
}) {
  return (
    <>
      <Field label="Name">
        <Input name="name" required defaultValue={user?.name} />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required defaultValue={user?.email} />
      </Field>
      <Field label="Role">
        <Select name="role" defaultValue={user?.role ?? "STAFF"}>
          {Object.entries(ROLES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={user ? "New password (optional)" : "Password"}>
        <Input name="password" type="password" required={!user} minLength={user ? undefined : 6} />
      </Field>
      {user ? (
        <Field label="Active">
          <Select name="active" defaultValue={user.active ? "1" : "0"}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </Select>
        </Field>
      ) : null}
    </>
  );
}

export default async function UsersPage() {
  const me = await requireUser(["ADMIN"]);
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Staff logins only — customers never create accounts."
        actions={
          <FormModal title="Add user" trigger="Add user" action={saveUser} submitLabel="Create user">
            <UserFields />
          </FormModal>
        }
      />
      <div className="flex flex-col gap-3">
        {users.map((u) => (
          <Card key={u.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted">{u.email}</p>
              </div>
              <Badge tone={u.active ? "good" : "bad"}>{ROLES[u.role]}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <FormModal
                title={`Edit ${u.name}`}
                trigger="Edit"
                triggerVariant="secondary"
                action={saveUser}
                compact
              >
                <input type="hidden" name="id" value={u.id} />
                <UserFields user={{ name: u.name, email: u.email, role: u.role, active: u.active }} />
              </FormModal>
              {u.id !== me.id ? (
                <DeleteButton
                  action={deleteUser}
                  id={u.id}
                  label="Deactivate"
                  confirmMessage={`Deactivate ${u.name}?`}
                />
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
