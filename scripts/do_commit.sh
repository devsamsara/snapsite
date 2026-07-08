#!/bin/bash
cd /home/ubuntu/snapsite
git add hooks/use-notifications.ts app/onboarding.tsx "app/(tabs)/settings.tsx" graphql/user.graphql gql/graphql.ts
git commit -m "feat: implementar flujo completo de notificaciones push"
git push origin master
