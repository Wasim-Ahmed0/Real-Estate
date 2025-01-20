import { Account, Avatars, Client, Databases, OAuthProvider, Query } from "react-native-appwrite";
import { openAuthSessionAsync } from "expo-web-browser";
import * as Linking from "expo-linking";

export const config = {
    platform: 'com.wasim.realstate',
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseID: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    galleriesCollectionID: process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
    reviewsCollectionID: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
    agentsCollectionID: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
    propertiesCollectionID: process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
}

export const client = new Client();

client
    .setEndpoint(config.endpoint!) 
    .setProject(config.projectID!)
    .setPlatform(config.platform!)

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);

export async function login () {
    try {
        const redirectUri = Linking.createURL("/");
        const response = await account.createOAuth2Token(
            OAuthProvider.Google, redirectUri
        )

        if (!response) throw new Error ('Failed to login');

        const browserResult = await openAuthSessionAsync(
            response.toString(),
            redirectUri
        );

        if (browserResult.type != 'success') throw new Error ('Failed to login');

        const url = new URL(browserResult.url);
        const secret = url.searchParams.get('secret')?.toString();
        const userId = url.searchParams.get('userId')?.toString();

        if (!secret || !userId) throw new Error ('Failed to login');

        const session = await account.createSession(userId, secret);
        if (!session) throw new Error('Failed to create a session');

        return true;

    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function logout () {
    try {
        await account.deleteSession('current');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function getCurrentUser () {
    try {
        const response = await account.get();
        if (response.$id) {
            const userAvatar = avatar.getInitials(response.name);
            return {
                ...response,
                avatar: userAvatar.toString(),
            }
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function getLatestProperties () {
    try {
        const result = await databases.listDocuments(
            config.databaseID!,
            config.propertiesCollectionID!,
            [Query.orderAsc('$createdAt'), Query.limit(5)]
        );
        return result.documents;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getProperties ({ filter, query, limit }: { filter: string; query: string; limit?: number }) {
    try {
        const buildQuery = [Query.orderDesc('$createdAt')];

        if(filter && filter != 'All') {
            buildQuery.push(Query.equal('type', filter));
        }

        if(query) {
            buildQuery.push(
                Query.or([
                    Query.search('name', query),
                    Query.search('address', query),
                    Query.search('type', query)
                ])
            );
        }

        if(limit) {
            buildQuery.push(Query.limit(limit));
        }

        const result = await databases.listDocuments(
            config.databaseID!,
            config.propertiesCollectionID!,
            buildQuery,
        );
        return result.documents;
    } catch (error) {
        console.error(error);
        return [];
    }
}