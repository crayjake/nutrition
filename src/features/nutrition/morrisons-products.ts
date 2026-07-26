export interface MorrisonsPackDetails {
  pricePence: number;
  imageUrl: string;
  productUrl: string;
}

export interface MorrisonsProductDetails {
  checkedOn: string;
  packs: Record<string, MorrisonsPackDetails>;
}

const IMAGE_ROOT =
  "https://groceries.morrisons.com/images-v3/4b85987b-1398-4173-a0c1-3546047c9d74";

export function packKey(quantity: number, unit: string): string {
  return `${quantity}:${unit}`;
}

export const MORRISONS_PRODUCT_DETAILS: Record<
  string,
  MorrisonsProductDetails
> = {
  fage_total_0_950g: {
    checkedOn: "2026-07-26",
    packs: {
      "950:g": {
        pricePence: 590,
        imageUrl: `${IMAGE_ROOT}/78c5b236-7c1a-4843-ae9f-f8e9cc095650/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/fage-total-0-fat-strained-yoghurt-950g/112364378"
      }
    }
  },
  fuel10k_chocolate_granola_400g: {
    checkedOn: "2026-07-26",
    packs: {
      "400:g": {
        pricePence: 300,
        imageUrl: `${IMAGE_ROOT}/cbdf5736-185b-494c-8379-fd70252c20e7/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/fuel10k-chocolate-chunks-protein-granola-breakfast-cereal-400g/109120006"
      }
    }
  },
  m_organic_clear_honey_340g: {
    checkedOn: "2026-07-26",
    packs: {
      "340:g": {
        pricePence: 335,
        imageUrl: `${IMAGE_ROOT}/761f3a4f-fc1a-4590-b385-33bd499210a0/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/m-organic-squeezy-pure-clear-honey-340g/104406291"
      }
    }
  },
  fyffes_medium_banana: {
    checkedOn: "2026-07-26",
    packs: {
      "8:item": {
        pricePence: 148,
        imageUrl: `${IMAGE_ROOT}/fcd033e7-028c-4d31-8c99-266d60e8fdd0/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-fyffes-premium-bananas-ripen-at-home/113997003"
      }
    }
  },
  yutaka_sushi_rice_500g: {
    checkedOn: "2026-07-26",
    packs: {
      "500:g": {
        pricePence: 220,
        imageUrl: `${IMAGE_ROOT}/ca2291cd-793e-4eb4-b2b7-bec798bea555/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/yutaka-sushi-rice/105189399"
      }
    }
  },
  tofoo_naked_tofu_280g: {
    checkedOn: "2026-07-26",
    packs: {
      "280:g": {
        pricePence: 200,
        imageUrl: `${IMAGE_ROOT}/a3eec4ea-0f34-4800-87cb-5df3c64090b4/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/the-tofoo-co-naked-tofu-280g/111461045"
      }
    }
  },
  morrisons_country_mix_1kg: {
    checkedOn: "2026-07-26",
    packs: {
      "1000:g": {
        pricePence: 150,
        imageUrl: `${IMAGE_ROOT}/e0e758df-297e-434e-9c1f-3db6551210a4/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-country-mix-1kg/115848466"
      }
    }
  },
  kikkoman_less_salt_soy_150ml: {
    checkedOn: "2026-07-26",
    packs: {
      "150:ml": {
        pricePence: 245,
        imageUrl: `${IMAGE_ROOT}/12ffe3fb-d653-488b-841d-da1a7241c1d5/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/kikkoman-less-salt-soy-sauce/113741331"
      }
    }
  },
  morrisons_sunflower_oil_1l: {
    checkedOn: "2026-07-26",
    packs: {
      "1000:ml": {
        pricePence: 330,
        imageUrl: `${IMAGE_ROOT}/e3978b9f-140d-4dc9-9f74-681b91bf9a38/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-organic-sunflower-oil-1l/114775701"
      }
    }
  },
  morrisons_lightly_salted_rice_cake: {
    checkedOn: "2026-07-26",
    packs: {
      "100:g": {
        pricePence: 95,
        imageUrl: `${IMAGE_ROOT}/45a22d76-17d4-49b5-b28e-4d6343cbe41c/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-lightly-salted-rice-cakes/105404968"
      }
    }
  },
  nature_valley_oats_honey_wrapper: {
    checkedOn: "2026-07-26",
    packs: {
      "5:wrapper": {
        pricePence: 250,
        imageUrl: `${IMAGE_ROOT}/b7ce0ffd-71cd-4bd9-9472-124c0b3ba486/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/nature-valley-crunchy-oats-honey-cereal-bars/105852082"
      }
    }
  },
  morrisons_penne_500g: {
    checkedOn: "2026-07-26",
    packs: {
      "500:g": {
        pricePence: 69,
        imageUrl: `${IMAGE_ROOT}/9ade3c5a-3a02-463c-8715-5b225e580a77/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-penne/104555641"
      }
    }
  },
  morrisons_green_pesto_190g: {
    checkedOn: "2026-07-26",
    packs: {
      "190:g": {
        pricePence: 89,
        imageUrl: `${IMAGE_ROOT}/8619ea61-69b3-4ec0-b6ca-1a3b64fb0dcf/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-green-pesto/104557735"
      }
    }
  },
  morrisons_whole_leaf_spinach_950g: {
    checkedOn: "2026-07-26",
    packs: {
      "950:g": {
        pricePence: 150,
        imageUrl: `${IMAGE_ROOT}/26acad2f-3661-4659-8685-c28638e09836/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-whole-leaf-spinach-950g/115846655"
      }
    }
  },
  morrisons_chicken_breast: {
    checkedOn: "2026-07-26",
    packs: {
      "630:g": {
        pricePence: 485,
        imageUrl: `${IMAGE_ROOT}/f0bbb525-b4ac-408e-89cc-5b118f25c78f/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-british-chicken-breast-fillets-630g/108444754"
      },
      "1000:g": {
        pricePence: 699,
        imageUrl: `${IMAGE_ROOT}/e469778f-b9e9-4a73-ad01-6839082207bf/500x500.jpg`,
        productUrl:
          "https://groceries.morrisons.com/products/morrisons-british-chicken-breast-fillets-1kg/108444711"
      }
    }
  }
};
