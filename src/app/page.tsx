'use client';

import { Cell, List, Section, Text } from '@telegram-apps/telegram-ui';

import { Link } from '@/components/Link/Link';
import { Page } from '@/components/Page';

const screenLinks = [
  {
    href: '/catalog',
    title: 'Catalog',
    subtitle: 'Products list and filters will be added in the next stage',
  },
  {
    href: '/products/demo-product',
    title: 'Product Page',
    subtitle: 'Route placeholder for an individual product screen',
  },
  {
    href: '/cart',
    title: 'Cart',
    subtitle: 'Placeholder for cart and checkout logic',
  },
  {
    href: '/profile',
    title: 'Profile',
    subtitle: 'Base user profile and settings screen',
  },
  {
    href: '/orders',
    title: 'My Orders',
    subtitle: 'Order history and status placeholder',
  },
  {
    href: '/admin',
    title: 'Admin',
    subtitle: 'Admin area scaffold without business logic',
  },
];

export default function Home() {
  return (
    <Page back={false}>
      <List>
        <Section header="MainStore">
          <Text>
            Telegram Mini App baseline for the future MainStore shop.
          </Text>
          <Text>
            This stage keeps only infrastructure and route placeholders.
          </Text>
        </Section>
        <Section header="Store Screens">
          {screenLinks.map((screen) => (
            <Link key={screen.href} href={screen.href}>
              <Cell subtitle={screen.subtitle}>{screen.title}</Cell>
            </Link>
          ))}
        </Section>
      </List>
    </Page>
  );
}
