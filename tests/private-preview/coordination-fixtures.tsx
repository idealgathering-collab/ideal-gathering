const id = "63000000-0000-4000-8000-000000000001",
  key = `member:${id}`;
const guestKey = "guest:63000000-0000-4000-8000-000000000009";
const state = {
  actor: key,
  is_host: true,
  participants: [
    { key, label: "مریم / Maryam", guest: false },
    { key: guestKey, label: "آرمان / Arman", guest: true },
  ],
  items: [
    {
      id: "63000000-0000-4000-8000-000000000002",
      label: "چای و لیوان بیاورید / Bring tea and cups",
      assignee: key,
      assignee_label: "مریم / Maryam",
      active: true,
      done: false,
      guest_visible: true,
    },
    {
      id: "63000000-0000-4000-8000-000000000003",
      label: "فهرست وسایل با متن طولانی برای بررسی شکست خط در موبایل",
      assignee: null,
      assignee_label: null,
      active: false,
      done: false,
      guest_visible: false,
    },
  ],
  notes: [
    {
      id: "63000000-0000-4000-8000-000000000004",
      body: "اگر حساسیت غذایی دارید با میزبان هماهنگ کنید.\nPlease discuss any food allergies with the host.",
      version: 1,
      can_edit: true,
      guest_visible: true,
    },
  ],
  expenses: [
    {
      id: "63000000-0000-4000-8000-000000000005",
      label: "چای و خوراکی / Tea and snacks",
      amount: 250000,
      currency: "IRT",
      payer: key,
      payer_label: "مریم / Maryam",
      shares: [
        { key, label: "مریم / Maryam", amount: 125000 },
        { key: guestKey, label: "آرمان / Arman", amount: 125000 },
      ],
    },
  ],
};
export async function manageGatheringCoordination({
  data,
}: {
  data: { action: string; data?: Record<string, unknown> };
}) {
  if (data.action === "task" && data.data) {
    const item = state.items.find((i) => i.id === data.data?.item);
    if (item) {
      if (data.data.operation === "share") item.guest_visible = Boolean(data.data.guest_visible);
      if (data.data.operation === "done") item.done = Boolean(data.data.done);
    }
  }
  const result = structuredClone({
    ...state,
    is_host: new URLSearchParams(location.search).get("mode") !== "coord-member",
  });
  if (!result.is_host) {
    result.participants
      .filter((p) => p.guest)
      .forEach((p) => {
        p.label = "Guest";
      });
    result.expenses.forEach((e) =>
      e.shares
        .filter((s) => s.key.startsWith("guest:"))
        .forEach((s) => {
          s.label = "Guest";
        }),
    );
  }
  return result;
}
