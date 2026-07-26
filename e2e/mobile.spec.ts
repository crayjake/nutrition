import { expect, test } from "@playwright/test";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const routes = ["/", "/shopping/", "/climbing/", "/progress/", "/settings/"];
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
    page.getByRole("progressbar", { name: /calories eaten: 501 of/i })
  ).toBeVisible();
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
  await page.goto(url("/shopping/"));
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
  await expect(fage.locator("..")).toContainText("£5.90");
  await expect(page.getByText("Estimated Morrisons total")).toBeVisible();
  await expect(
    page.locator(".shopping-product-image img").first()
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".shopping-product-image img")
        .first()
        .evaluate((image) => {
          const element = image as HTMLImageElement;
          return element.complete && element.naturalWidth > 0;
        })
    )
    .toBe(true);
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
  const summarySlot = page.locator(".daily-summary-slot");
  const expanded = await summary.boundingBox();
  const expandedSlot = await summarySlot.boundingBox();
  expect(expanded).not.toBeNull();
  expect(expandedSlot).not.toBeNull();

  await page.evaluate(() => window.scrollTo(0, 700));
  await expect(summary).toHaveAttribute("data-stuck", "true");
  await page.waitForTimeout(250);

  const scrolledHeader = await header.boundingBox();
  const compact = await summary.boundingBox();
  const compactSlot = await summarySlot.boundingBox();
  const scrollY = await page.evaluate(() => window.scrollY);
  const stickyTop = await summary.evaluate((card) =>
    Number.parseFloat(getComputedStyle(card).top)
  );
  const ringBoxes = await summary.locator(".macro-ring").evaluateAll((rings) =>
    rings.map((ring) => {
      const { x, width } = ring.getBoundingClientRect();
      return { x, width };
    })
  );
  expect(scrolledHeader).not.toBeNull();
  expect(compact).not.toBeNull();
  expect(compactSlot).not.toBeNull();
  expect(ringBoxes).toHaveLength(3);
  expect(new Set(ringBoxes.map(({ width }) => Math.round(width))).size).toBe(1);
  expect(ringBoxes[0].x + ringBoxes[0].width).toBeLessThanOrEqual(ringBoxes[1].x);
  expect(ringBoxes[1].x + ringBoxes[1].width).toBeLessThanOrEqual(ringBoxes[2].x);
  expect(scrolledHeader!.y + scrolledHeader!.height).toBeLessThanOrEqual(1);
  expect(compact!.height).toBeLessThan(expanded!.height * 0.8);
  expect(compact!.height).toBeLessThan(145);
  expect(compact!.y).toBeCloseTo(stickyTop, 0);
  expect(compactSlot!.height).toBeCloseTo(expandedSlot!.height, 0);
  expect(scrollY).toBeCloseTo(700, 0);
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
  const emberBackground = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor
  );
  await page.getByRole("button", { name: /ocean/i }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-colour-scheme",
    "ocean"
  );
  const oceanBackground = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor
  );
  expect(oceanBackground).not.toBe(emberBackground);
  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Progress" }).click();
  await expect(page).toHaveURL(new RegExp(`${basePath}/progress/?$`));
});

test("bottom navigation stays docked as browser chrome changes", async ({
  page
}) => {
  await page.goto(url("/shopping/"));
  await page.evaluate(() => window.scrollTo(0, 700));
  const navigation = page.getByRole("navigation", { name: "Primary" });

  for (const height of [700, 812]) {
    await page.setViewportSize({ width: 375, height });
    const bounds = await navigation.boundingBox();
    const visibleHeight = await page.evaluate(
      () => window.visualViewport?.height ?? window.innerHeight
    );
    expect(bounds).not.toBeNull();
    expect(bounds!.y + bounds!.height).toBeGreaterThanOrEqual(visibleHeight);
    expect(bounds!.y).toBeLessThan(visibleHeight);
  }
});

test("installed app metadata uses the Crux icon", async ({ page }) => {
  await page.goto(url("/"));
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    `${basePath}/apple-touch-icon-v2.png`
  );

  const response = await page.request.get(url("/manifest.webmanifest"));
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: `${basePath}/icon-192.png?v=2`,
        sizes: "192x192"
      }),
      expect.objectContaining({
        src: `${basePath}/icon-maskable-512.png?v=2`,
        purpose: "maskable"
      })
    ])
  );
});

test("climbing sessions persist and feed climbing progress", async ({ page }) => {
  await page.goto(url("/climbing/"));
  const dateBounds = await page.getByLabel("Date").boundingBox();
  const lengthBounds = await page.getByLabel("Length (minutes)").boundingBox();
  expect(dateBounds).not.toBeNull();
  expect(lengthBounds).not.toBeNull();
  expect(dateBounds!.y + dateBounds!.height).toBeLessThanOrEqual(
    lengthBounds!.y
  );
  await page.getByLabel("Length (minutes)").fill("75");
  await page.getByLabel("Session difficulty").fill("8");
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("radio", { name: /blue/i }).click();
  await page.getByRole("radio", { name: "Hard" }).click();
  await page.getByRole("checkbox", { name: /sent/i }).check();
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page.getByText("Climbing session saved.")).toBeVisible();
  await expect(page.getByText(/75 min · 8\/10 hard/i)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/75 min · 8\/10 hard/i)).toBeVisible();
  await page.getByRole("link", { name: "Progress" }).click();
  await page.getByRole("radio", { name: "Climbing", exact: true }).click();
  await expect(page.getByText("Blue · Hard · 6").first()).toBeVisible();
  await expect(page.getByTestId("session-length-chart")).toBeVisible();
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
