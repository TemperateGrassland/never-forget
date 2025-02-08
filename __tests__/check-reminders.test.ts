import request from "supertest";
import { GET } from "@/app/api/jobs/check-reminders/route";
import test from "node:test";

test("GET /api/jobs/check-reminders should return reminders", async () => {
  const res = await GET(new Request("http://localhost/api/jobs/check-reminders"));
  expect(res.status).toBe(200);
});