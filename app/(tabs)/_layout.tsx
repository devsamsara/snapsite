import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "react-i18next";
import HomeScreen from "./index";
import ProjectsScreen from "./projects";
import ProfileScreen from "./profile";
import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ONBOARDING_DONE_KEY } from "@/app/onboarding";

export default function TabLayout() {
  const { t }  = useTranslation();
  const colors = useColors();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((done) => {
      if (!done) {
        router.replace("/onboarding");
      } else {
        setChecked(true);
      }
    });
  }, []);

  if (!checked) return null;

  const tabs = [
    { name: "index"    as const, title: t('tabs.home'),     icon: "house.fill",       component: HomeScreen    },
    { name: "projects" as const, title: t('tabs.projects'), icon: "photo.stack.fill", component: ProjectsScreen },
    { name: "profile"  as const, title: t('tabs.profile'),  icon: "person.fill",      component: ProfileScreen  },
  ];

  return (
    <NativeTabs
      iconColor={colors.primary}
      blurEffect="systemChromeMaterialDark"
      indicatorColor={colors.primary}
      minimizeBehavior="onScrollUp"
      tintColor={colors.primary}
      shadowColor={colors.primary}
      rippleColor={colors.primary}
      backgroundColor={colors.primary}
    >
      {tabs.map((tab) => (
        <NativeTabs.Trigger
          key={tab.name}
          name={tab.name}
          options={{
            selectedIconColor: colors.primary,
            iconColor:         colors.primary,
            indicatorColor:    colors.primary,
            shadowColor:       colors.primary,
          }}
        >
          <Label>{tab.title}</Label>
          <Icon sf={tab.icon as any} drawable="ic_menu_mylocation" />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
