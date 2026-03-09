'use client';

import { List, Section, Text } from '@telegram-apps/telegram-ui';

import { Page } from '@/components/Page';

interface StoreStubScreenProps {
  title: string;
  description: string;
  back?: boolean;
}

export function StoreStubScreen({
  title,
  description,
  back = true,
}: StoreStubScreenProps) {
  return (
    <Page back={back}>
      <List>
        <Section header={title}>
          <Text>{description}</Text>
        </Section>
      </List>
    </Page>
  );
}
