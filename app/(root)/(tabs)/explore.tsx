import icons from "@/constants/icons";
import images from "@/constants/images";
import { ActivityIndicator, Button, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Search from "@/components/search";
import { Card, FeaturedCard } from "@/components/cards";
import Filters from "@/components/filters";
import { useGlobalContext } from "@/lib/global-provider";
import { router, useLocalSearchParams } from "expo-router";
import { useAppwrite } from "@/lib/useAppwrite";
import { getLatestProperties, getProperties } from "@/lib/appwrite";
import { useEffect } from "react";
import NoResults from "@/components/noResults";

export default function Explore() {
	const params = useLocalSearchParams<{ query?: string; filter?: string; }>();

	const { data: latestProperties, loading: latestPropertiesLoading } = useAppwrite({
		fn: getLatestProperties
	});

	const { data: properties, loading, refetch } = useAppwrite({
		fn: getProperties,
		params: {
			filter: params.filter!,
			query: params.query!,
			limit: 20,
		},
		skip: true,
	});

	const handleCardPress = (id: string) => router.push(`/properties/${id}`);

	useEffect(() => {
		refetch({
			filter: params.filter!,
			query: params.query!,
			limit:20,
		})
	}, [params.filter, params.query]);

	return (
    	<SafeAreaView className="bg-white h-full">
			<FlatList 
				data={properties}
				renderItem={({ item }) => <Card item={item} onPress={() => handleCardPress(item.$id)} />}
				keyExtractor={(item) => item.$id}
				numColumns={2}
				contentContainerClassName="pb-16"
				columnWrapperClassName="flex gap-5 px-5"
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					loading ? (
						<ActivityIndicator size="large" className="text-primary-300 mt-5" />
					) : <NoResults />
				}
				ListHeaderComponent={
					<View className="px-5">
						<View className="flex flex-row items-center justify-between mt-5">
							<TouchableOpacity onPress={() => router.back()} className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center">
								<Image source={icons.backArrow} className="size-5"/>
							</TouchableOpacity>

							<Text className="text-base mr-2 text-center font-rubik-medium text-black-300">Search For Your Ideal Home</Text>

							<Image source={icons.bell} className="w-6 h-6" />
						</View>

						<Search />

						<View className="mt-5">
							<Filters />
							<Text className="text-xl font-rubik-bold text-black-300 mt-5">
								Found {properties?.length} Properties
							</Text>
						</View>
					</View>
				}
			/>
		</SafeAreaView>
  );
}
