import { FlatList, StyleSheet, Text, TouchableOpacity, View, } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchInput } from '@/components/ui/search-input';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQuery } from '@apollo/client/react';
import { GetMyProjectsDocument, Project, ProjectStatus } from '@/gql/graphql';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/use-colors';
import { useCardStyle } from '@/hooks/use-card-style';
import { useState } from 'react';
import { ProjectsListSkeleton } from '@/components/projects-list-skeleton';
import { useRelativeDate } from '@/hooks/use-relative-date';

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useColors();
  const cardElevation = useCardStyle();
  const relativeDate = useRelativeDate();
  // isLoading: cuando se integre el useQuery real, reemplazar por { loading } del hook.
  const isLoading = false;
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { isLoading: authLoading } = useAuth();
  const { data } = useQuery(GetMyProjectsDocument, {
    skip: authLoading,
  });

  const filteredProjects: any[] =
    data?.getMyProjects.filter(project => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchText.toLowerCase()) ||
        project.location.toLowerCase().includes(searchText.toLowerCase());
      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'active' &&
          project.status === ProjectStatus.Active) ||
        (selectedFilter === 'completed' &&
          project.status === ProjectStatus.Completed);
      return matchesSearch && matchesFilter;
    }) || ([] as Project[]);

  const filterLabels: Record<string, string> = {
    all: t('projects.filterAll'),
    active: t('projects.filterActive'),
    completed: t('projects.filterCompleted'),
  };

  const renderProjectCard = ({ item }: { item: Project }) => {
    const isCompleted = item.status === ProjectStatus.Completed;

      const getStatus = (status: ProjectStatus) => {
       switch (status) {
         case ProjectStatus.Completed:
           return t('projects.statusCompleted');
         case ProjectStatus.Active:
           return t('projects.statusActive');
         case ProjectStatus.Ongoing:
           return t('projects.statusOngoing');
         case ProjectStatus.Canceled:
           return t('projects.statusCancelled');
         default:
           return t('projects.statusArchived');
       }
      }
    return (
      <TouchableOpacity
        onPress={() => router.push(`/project/${item.id}`)}
        style={S.cardWrapper}
      >
        <View style={[S.card, cardElevation]}>
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text
                className="text-lg font-semibold text-foreground"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text className="text-sm text-muted mt-1">{item.location}</Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{
                backgroundColor: isCompleted
                  ? colors.success + '20'
                  : colors.primary + '20',
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: isCompleted ? colors.success : colors.primary }}
              >
                {getStatus(item.status)}
              </Text>
            </View>
          </View>

          <View className="mb-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-xs text-muted">
                {t('projects.progress')}
              </Text>
              <Text className="text-xs font-semibold text-foreground">
                {item.progress}%
              </Text>
            </View>
            <View
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: colors.border }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${item.progress}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          </View>

          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <IconSymbol
                name="photo.stack.fill"
                size={14}
                color={colors.muted}
              />
              <Text className="text-xs text-muted" style={S.photosLabel}>
                {item.photos.length} {t('projects.photos')}
              </Text>
            </View>
            {/* Fecha relativa calculada desde el timestamp */}
            <Text className="text-xs text-muted">
              {relativeDate(Number.parseInt(item.createdAt))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="p-0">
        <ProjectsListSkeleton count={4} />
      </ScreenContainer>
    );
  }

  return (
    data && (
      <ScreenContainer className="p-0">
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className="px-4 pt-4 pb-4 border-b border-border">
            <View style={S.headerRow}>
              <Text className="text-3xl font-bold text-foreground">
                {t('projects.title')}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/create-project-location')}
                style={[S.addBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialIcons name="add" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <SearchInput
              placeholder={t('projects.searchPlaceholder')}
              value={searchText}
              onChangeText={setSearchText}
              style={S.searchBar}
            />

            {/* Filter Buttons */}
            <View className="flex-row gap-2">
              {(['all', 'active', 'completed'] as const).map(filter => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  className="px-4 py-2 rounded-full border border-border"
                  style={{
                    backgroundColor:
                      selectedFilter === filter
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedFilter === filter
                        ? colors.primary
                        : colors.border,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color:
                        selectedFilter === filter
                          ? '#FFFFFF'
                          : colors.foreground,
                    }}
                  >
                    {filterLabels[filter]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Projects List */}
          <FlatList
            data={filteredProjects}
            renderItem={renderProjectCard}
            keyExtractor={item => item.id}
            contentContainerStyle={S.listContent}
            scrollEnabled={true}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-12">
                <IconSymbol
                  name="folder.badge.plus"
                  size={48}
                  color={colors.border}
                />
                <Text className="text-lg font-semibold text-foreground mt-4">
                  {t('projects.noProjects')}
                </Text>
                <Text className="text-sm text-muted text-center mt-2">
                  {t('projects.noProjectsSubtitle')}
                </Text>
              </View>
            }
          />
          {/* FAB eliminado — el botón de nuevo proyecto está en el header */}
        </View>
      </ScreenContainer>
    )
  );
}

const S = StyleSheet.create({
  cardWrapper: { marginBottom: 12 },
  card: { borderRadius: 16, padding: 16 },
  photosLabel: { marginLeft: 6 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: { marginBottom: 12 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
});
