declare module '#auth-utils' {
  interface User {
    login: string;
    id: number | string;
    name: string;
    email: string;
    bio: string;
    // GitHub uses avatar_url, Google uses avatarUrl - support both
    avatar_url?: string;
    avatarUrl?: string;
    // GitHub-specific fields (optional for Google users)
    node_id?: string;
    gravatar_id?: string;
    url?: string;
    html_url?: string;
    followers_url?: string;
    following_url?: string;
    gists_url?: string;
    starred_url?: string;
    subscriptions_url?: string;
    organizations_url?: string;
    repos_url?: string;
    events_url?: string;
    received_events_url?: string;
    type?: string;
    user_view_type?: string;
    site_admin?: boolean;
    company?: string | null;
    blog?: string;
    location?: string;
    hireable?: boolean;
    twitter_username?: string;
    notification_email?: string;
    public_repos?: number;
    public_gists?: number;
    followers?: number;
    following?: number;
    created_at?: string;
    updated_at?: string;
  }
}
export { };
