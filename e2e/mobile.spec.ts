import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const routes = ["/", "/plan/", "/progress/", "/settings/"];
const url = (route: string) => `${basePath}${route}` || "/";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-storage-ready")) {
      localStorage.clear();
      sessionStorage.setItem("e2e-storage-ready", "true");
    }
  });
});

for (const route of routes) {
  test(`${route} loads directly without horizontal overflow`, async ({ page }) => {
    await page.goto(url(route));
    await expect(page.locator("main")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  });
}

test("daily interactions persist across reload", async ({ page }) => {
  await page.goto(url("/"));
  await page.getByRole("checkbox", { name: /mark complete/i }).first().click();
  await expect(
    page.getByRole("progressbar", { name: /energy eaten/i })
  ).toHaveAttribute("aria-valuenow", "501");
  await page.getByRole("button", { name: "+ 250 ml" }).click();
  await page.getByLabel("Weight in kilograms").fill("72.4");
  await page.getByRole("button", { name: "Save" }).click();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /mark incomplete/i }).first()).toBeVisible();
  await expect(page.getByText("250 ml", { exact: true })).toBeVisible();
  await expect(page.getByText("72.4 kg recorded")).toBeVisible();
});

test("shopping list calculates whole packs and supports check-off", async ({
  page
}) => {
  await page.goto(url("/plan/"));
  const decreaseClimbing = page.getByRole("button", {
    name: "Decrease Climbing · Tofu days"
  });
  const climbingDays = page.getByRole("spinbutton", {
    name: "Climbing · Tofu days"
  });
  await decreaseClimbing.click();
  await expect(climbingDays).toHaveValue("3");
  await decreaseClimbing.click();
  await expect(climbingDays).toHaveValue("2");
  await decreaseClimbing.click();
  await expect(climbingDays).toHaveValue("1");
  const decreaseRest = page.getByRole("button", {
    name: "Decrease Rest · Tofu days"
  });
  const restDays = page.getByRole("spinbutton", {
    name: "Rest · Tofu days"
  });
  await decreaseRest.click();
  await expect(restDays).toHaveValue("2");
  await decreaseRest.click();
  await expect(restDays).toHaveValue("1");
  await decreaseRest.click();
  await expect(restDays).toHaveValue("0");
  const fage = page.getByRole("checkbox", { name: /check off fage/i });
  await expect(fage.locator("..")).toContainText("1tub");
  await fage.click();
  await expect(
    page.getByRole("checkbox", { name: /uncheck fage/i })
  ).toHaveAttribute("aria-checked", "true");
});

test("header scrolls away and daily summary compacts when sticky", async ({
  page
}) => {
  await page.goto(url("/"));
  const header = page.locator(".app-header");
  const summary = page.locator(".daily-summary-card");
  const expanded = await summary.boundingBox();
  expect(expanded).not.toBeNull();

  await page.evaluate(() => window.scrollTo(0, 700));
  await expect(summary).toHaveAttribute("data-stuck", "true");

  const scrolledHeader = await header.boundingBox();
  const compact = await summary.boundingBox();
  expect(scrolledHeader).not.toBeNull();
  expect(compact).not.toBeNull();
  expect(scrolledHeader!.y + scrolledHeader!.height).toBeLessThanOrEqual(1);
  expect(compact!.height).toBeLessThan(expanded!.height * 0.8);
  expect(compact!.y).toBeGreaterThanOrEqual(0);
  expect(compact!.y).toBeLessThanOrEqual(1);
});

test("date navigation and meal expansion are touch friendly", async ({ page }) => {
  await page.goto(url("/"));
  const heading = page.locator(".date-navigation h1");
  const firstDate = await heading.textContent();
  await page.getByRole("button", { name: "Previous day" }).click();
  await expect(heading).not.toHaveText(firstDate ?? "");
  await page.getByRole("button", { name: /show ingredients/i }).first().click();
  await expect(page.getByText("Meal total").first()).toBeVisible();
});

test("theme and bottom navigation remain usable", async ({ page }) => {
  await page.goto(url("/settings/"));
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Progress" }).click();
  await expect(page).toHaveURL(new RegExp(`${basePath}/progress/?$`));
});

test("fits 320px and 430px phone widths", async ({ page }) => {
  for (const width of [320, 430]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(url("/"));
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  }
});
