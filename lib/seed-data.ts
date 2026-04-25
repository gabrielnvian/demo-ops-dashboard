export type SeedOrder = {
  id: string;
  title: string;
  customer: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  dueAt: string | null;
  notes: string | null;
  createdAt: string;
};

export const SEED_ORDERS: SeedOrder[] = [
  {
    id: "seed-01",
    title: "Replace kitchen faucet",
    customer: "The Ashford Family",
    status: "PENDING",
    dueAt: "2026-04-28T00:00:00.000Z",
    notes: null,
    createdAt: "2026-04-20T08:00:00.000Z",
  },
  {
    id: "seed-02",
    title: "Annual HVAC inspection",
    customer: "Northland Bakery",
    status: "IN_PROGRESS",
    dueAt: "2026-04-25T00:00:00.000Z",
    notes: "Two rooftop units, access via freight elevator.",
    createdAt: "2026-04-18T09:30:00.000Z",
  },
  {
    id: "seed-03",
    title: "Drywall repair - dining room",
    customer: "Melbourne Rentals",
    status: "PENDING",
    dueAt: "2026-05-03T00:00:00.000Z",
    notes: null,
    createdAt: "2026-04-19T10:15:00.000Z",
  },
  {
    id: "seed-04",
    title: "Clear blocked main line",
    customer: "Pine Ridge HOA",
    status: "COMPLETED",
    dueAt: "2026-04-18T00:00:00.000Z",
    notes: "Root intrusion found and cleared.",
    createdAt: "2026-04-15T07:45:00.000Z",
  },
  {
    id: "seed-05",
    title: "Install backup generator",
    customer: "Harbor Bay Clinic",
    status: "PENDING",
    dueAt: "2026-05-10T00:00:00.000Z",
    notes: "20 kW unit, permit already pulled.",
    createdAt: "2026-04-21T11:00:00.000Z",
  },
  {
    id: "seed-06",
    title: "Network switch replacement - floor 3",
    customer: "Meridian Properties",
    status: "COMPLETED",
    dueAt: "2026-04-10T00:00:00.000Z",
    notes: "Upgraded to gigabit, patch panel relabeled.",
    createdAt: "2026-04-05T09:00:00.000Z",
  },
  {
    id: "seed-07",
    title: "Parking lot lighting retrofit",
    customer: "Eastside Storage",
    status: "IN_PROGRESS",
    dueAt: "2026-04-30T00:00:00.000Z",
    notes: "30 LED fixtures, half done.",
    createdAt: "2026-04-17T08:00:00.000Z",
  },
  {
    id: "seed-08",
    title: "Office repaint - reception and lobby",
    customer: "Vantage Financial",
    status: "COMPLETED",
    dueAt: "2026-04-12T00:00:00.000Z",
    notes: null,
    createdAt: "2026-04-07T08:30:00.000Z",
  },
  {
    id: "seed-09",
    title: "Roof membrane inspection",
    customer: "Summit Plaza LLC",
    status: "CANCELLED",
    dueAt: "2026-04-20T00:00:00.000Z",
    notes: "Customer postponed indefinitely.",
    createdAt: "2026-04-10T14:00:00.000Z",
  },
  {
    id: "seed-10",
    title: "Security camera installation",
    customer: "Westbrook Pharmacy",
    status: "IN_PROGRESS",
    dueAt: "2026-04-27T00:00:00.000Z",
    notes: "8 cameras, DVR in back office.",
    createdAt: "2026-04-22T10:00:00.000Z",
  },
  {
    id: "seed-11",
    title: "Boiler service and flush",
    customer: "Northland Bakery",
    status: "COMPLETED",
    dueAt: "2026-03-30T00:00:00.000Z",
    notes: null,
    createdAt: "2026-03-25T07:00:00.000Z",
  },
  {
    id: "seed-12",
    title: "ADA ramp installation",
    customer: "Pine Ridge HOA",
    status: "PENDING",
    dueAt: "2026-05-15T00:00:00.000Z",
    notes: "City inspection required after install.",
    createdAt: "2026-04-23T09:00:00.000Z",
  },
];

export const SEED_COUNTS = {
  total: SEED_ORDERS.length,
  pending: SEED_ORDERS.filter((o) => o.status === "PENDING").length,
  inProgress: SEED_ORDERS.filter((o) => o.status === "IN_PROGRESS").length,
  completed: SEED_ORDERS.filter((o) => o.status === "COMPLETED").length,
};
