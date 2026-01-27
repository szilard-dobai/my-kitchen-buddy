"use client";

import { BarChart3, Loader2, LogOut, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TrackingDocument, TrackingEventType } from "@/lib/tracking/types";

type SortField = "timestamp" | "type" | "deviceId";
type SortOrder = "asc" | "desc";

const EVENT_TYPES: TrackingEventType[] = [
  "homepage_view",
  "settings_view",
  "recipes_view",
  "extract_view",
  "recipe_detail_view",
  "recipe_edit_view",
  "terms_view",
  "privacy_view",
  "login_view",
  "register_view",
  "homepage_cta_click",
  "header_logo_click",
  "header_dropdown_open",
  "header_mobile_menu_toggle",
  "recipe_card_click",
  "filter_applied",
  "sort_applied",
  "filters_cleared",
  "recipe_search",
  "recipe_deleted",
  "extraction_attempt",
  "extraction_success",
  "extraction_error",
  "recipe_edited",
  "plan_card_click",
  "subscribe_click",
  "telegram_connect_click",
  "telegram_disconnect_click",
  "login_attempt",
  "register_attempt",
];

interface Stats {
  total: number;
  filtered: number;
  uniqueDevices: number;
  filteredUniqueDevices: number;
  eventTypes: number;
  filteredEventTypes: number;
  uniqueCountries: number;
  filteredUniqueCountries: number;
  countries: string[];
  regions: string[];
}

interface CountryDeviceCount {
  country: string;
  deviceCount: number;
}

interface HighLevelStats {
  totalEvents: number;
  uniqueCountries: number;
  uniqueDevices: number;
  uniqueUsers: number;
  deviceTypePercentages: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  deviceTypeCounts: Record<string, number>;
  extractions: {
    attempts: number;
    successes: number;
    errors: number;
    successRate: string;
  };
  pageViews: {
    homepage: number;
    recipes: number;
    extract: number;
    settings: number;
    recipeDetail: number;
    login: number;
    register: number;
  };
  eventBreakdown: Record<string, number>;
  topCountriesByDevices: CountryDeviceCount[];
}

export default function AnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [events, setEvents] = useState<TrackingDocument[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deviceIdFilter, setDeviceIdFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [selectedEvent, setSelectedEvent] = useState<TrackingDocument | null>(
    null,
  );

  const [showHighLevelStats, setShowHighLevelStats] = useState(false);
  const [highLevelStats, setHighLevelStats] = useState<HighLevelStats | null>(
    null,
  );
  const [isLoadingHighLevelStats, setIsLoadingHighLevelStats] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const buildFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (deviceIdFilter) params.set("deviceId", deviceIdFilter);
    if (searchQuery) params.set("search", searchQuery);
    if (countryFilter !== "all") params.set("country", countryFilter);
    if (regionFilter !== "all") params.set("region", regionFilter);
    return params;
  }, [typeFilter, deviceIdFilter, searchQuery, countryFilter, regionFilter]);

  const buildQueryParams = useCallback(
    (extraParams?: Record<string, string>) => {
      const params = buildFilterParams();
      params.set("sortField", sortField);
      params.set("sortOrder", sortOrder);
      if (extraParams) {
        Object.entries(extraParams).forEach(([key, value]) => {
          params.set(key, value);
        });
      }
      return params.toString();
    },
    [buildFilterParams, sortField, sortOrder],
  );

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(
        `/api/tracking/stats?${buildFilterParams().toString()}`,
      );
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [buildFilterParams]);

  const fetchEvents = useCallback(
    async (resetOffset = true) => {
      const newOffset = resetOffset ? 0 : offset;
      if (resetOffset) {
        setIsLoadingEvents(true);
        setOffset(0);
      } else {
        setIsLoadingMore(true);
      }
      setEventsError("");

      try {
        const response = await fetch(
          `/api/tracking?${buildQueryParams({ limit: "50", offset: String(newOffset) })}`,
        );
        if (!response.ok) {
          if (response.status === 401) {
            setIsAuthenticated(false);
            return;
          }
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        if (resetOffset) {
          setEvents(data.events);
        } else {
          setEvents((prev) => [...prev, ...data.events]);
        }
        setHasMore(data.hasMore);
        if (!resetOffset) {
          setOffset(newOffset + 50);
        } else {
          setOffset(50);
        }
      } catch (error) {
        setEventsError(
          error instanceof Error ? error.message : "Unknown error",
        );
      } finally {
        setIsLoadingEvents(false);
        setIsLoadingMore(false);
      }
    },
    [buildQueryParams, offset],
  );

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchEvents(false);
    }
  }, [fetchEvents, hasMore, isLoadingMore]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/tracking/stats");
        if (response.ok) {
          setIsAuthenticated(true);
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const sortDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }

    filterDebounceRef.current = setTimeout(() => {
      fetchStats();
      fetchEvents(true);
    }, 300);

    return () => {
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    typeFilter,
    deviceIdFilter,
    searchQuery,
    countryFilter,
    regionFilter,
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (sortDebounceRef.current) {
      clearTimeout(sortDebounceRef.current);
    }

    sortDebounceRef.current = setTimeout(() => {
      fetchEvents(true);
    }, 300);

    return () => {
      if (sortDebounceRef.current) {
        clearTimeout(sortDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortOrder]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !isLoadingEvents
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoadingEvents, loadMore]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        const data = await response.json();
        setAuthError(data.error || "Invalid password");
      }
    } catch {
      setAuthError("Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setIsAuthenticated(false);
    setEvents([]);
    setStats(null);
  };

  const handleRefresh = () => {
    fetchStats();
    fetchEvents(true);
  };

  const fetchHighLevelStats = async () => {
    setIsLoadingHighLevelStats(true);
    try {
      const response = await fetch("/api/tracking/stats/high-level");
      if (!response.ok) {
        if (response.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        throw new Error("Failed to fetch high-level stats");
      }
      const data = await response.json();
      setHighLevelStats(data);
    } catch (error) {
      console.error("Failed to fetch high-level stats:", error);
    } finally {
      setIsLoadingHighLevelStats(false);
    }
  };

  const handleOpenHighLevelStats = () => {
    setShowHighLevelStats(true);
    fetchHighLevelStats();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-lg dark:bg-gray-900"
        >
          <h1 className="text-center text-xl font-semibold">Admin Access</h1>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          {authError && (
            <p className="text-center text-sm text-red-500">{authError}</p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <>
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <div className="min-h-screen p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenHighLevelStats}
              >
                <BarChart3 className="size-4" />
                <span className="hidden sm:inline">Overview</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoadingStats || isLoadingEvents}
              >
                <RefreshCw
                  className={`size-4 ${isLoadingStats || isLoadingEvents ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-lg border bg-white p-4 dark:bg-gray-900 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {(stats?.countries ?? []).map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {(stats?.regions ?? []).map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Device ID</Label>
              <Input
                className="w-full"
                placeholder="Filter by device ID..."
                value={deviceIdFilter}
                onChange={(e) => setDeviceIdFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Search Metadata</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search in metadata..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <div className="flex gap-2">
                <Select
                  value={sortField}
                  onValueChange={(v) => setSortField(v as SortField)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Time</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                    <SelectItem value="deviceId">Device</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortOrder}
                  onValueChange={(v) => setSortOrder(v as SortOrder)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
              <p className="text-sm text-gray-500">Total Events</p>
              <p className="text-2xl font-semibold">
                {isLoadingStats ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  (stats?.total ?? "-")
                )}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
              <p className="text-sm text-gray-500">Filtered</p>
              <p className="text-2xl font-semibold">
                {isLoadingStats ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  (stats?.filtered ?? "-")
                )}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
              <p className="text-sm text-gray-500">Unique Devices</p>
              <p className="text-2xl font-semibold">
                {isLoadingStats ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    {stats?.filteredUniqueDevices ?? "-"}
                    {stats &&
                      stats.filteredUniqueDevices !== stats.uniqueDevices && (
                        <span className="ml-1 text-sm font-normal text-gray-400">
                          / {stats.uniqueDevices}
                        </span>
                      )}
                  </>
                )}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
              <p className="text-sm text-gray-500">Event Types</p>
              <p className="text-2xl font-semibold">
                {isLoadingStats ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    {stats?.filteredEventTypes ?? "-"}
                    {stats && stats.filteredEventTypes !== stats.eventTypes && (
                      <span className="ml-1 text-sm font-normal text-gray-400">
                        / {stats.eventTypes}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
              <p className="text-sm text-gray-500">Unique Countries</p>
              <p className="text-2xl font-semibold">
                {isLoadingStats ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    {stats?.filteredUniqueCountries ?? "-"}
                    {stats &&
                      stats.filteredUniqueCountries !==
                        stats.uniqueCountries && (
                        <span className="ml-1 text-sm font-normal text-gray-400">
                          / {stats.uniqueCountries}
                        </span>
                      )}
                  </>
                )}
              </p>
            </div>
          </div>

          {eventsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {eventsError}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-3 text-left font-medium">Timestamp</th>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-left font-medium">Device</th>
                    <th className="p-3 text-left font-medium">Device ID</th>
                    <th className="p-3 text-left font-medium">Location</th>
                    <th className="p-3 text-left font-medium">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoadingEvents ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <Loader2 className="mx-auto size-6 animate-spin text-gray-400" />
                      </td>
                    </tr>
                  ) : (
                    <>
                      {events.map((event, idx) => (
                        <tr
                          key={`${event.timestamp}-${event.deviceId}-${idx}`}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <td className="whitespace-nowrap p-3 font-mono text-xs">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {event.type}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-gray-500">
                            {event.deviceType ?? "-"}
                          </td>
                          <td className="p-3 font-mono text-xs text-gray-500">
                            {event.deviceId.slice(0, 8)}...
                          </td>
                          <td className="p-3 text-xs text-gray-500">
                            {event.country
                              ? `${event.country}${event.region ? ` / ${event.region}` : ""}`
                              : "-"}
                          </td>
                          <td className="max-w-xs truncate p-3 text-xs text-gray-500">
                            {event.metadata
                              ? JSON.stringify(event.metadata).slice(0, 50) +
                                (JSON.stringify(event.metadata).length > 50
                                  ? "..."
                                  : "")
                              : "-"}
                          </td>
                        </tr>
                      ))}
                      {events.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-gray-500"
                          >
                            No events found
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex justify-center border-t p-4"
              >
                {isLoadingMore ? (
                  <Loader2 className="size-5 animate-spin text-gray-400" />
                ) : (
                  <Button variant="ghost" size="sm" onClick={loadMore}>
                    Load more
                  </Button>
                )}
              </div>
            )}
          </div>

          {selectedEvent && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setSelectedEvent(null)}
            >
              <div
                className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-xl dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b p-4">
                  <h2 className="font-semibold">Event Details</h2>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <Label className="text-gray-500">Type</Label>
                    <p className="font-mono">{selectedEvent.type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Timestamp</Label>
                    <p className="font-mono">
                      {new Date(selectedEvent.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Device Type</Label>
                    <p className="font-mono">
                      {selectedEvent.deviceType ?? "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Device ID</Label>
                    <p className="break-all font-mono text-sm">
                      {selectedEvent.deviceId}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">User ID</Label>
                    <p className="break-all font-mono text-sm">
                      {selectedEvent.userId ?? "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Location</Label>
                    <p className="font-mono">
                      {selectedEvent.country
                        ? `${selectedEvent.country}${selectedEvent.region ? ` / ${selectedEvent.region}` : ""}`
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Metadata</Label>
                    <pre className="mt-1 overflow-auto rounded bg-gray-100 p-3 text-xs dark:bg-gray-800">
                      {JSON.stringify(selectedEvent.metadata, null, 2) ||
                        "null"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Dialog
            open={showHighLevelStats}
            onOpenChange={setShowHighLevelStats}
          >
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
              <DialogHeader>
                <DialogTitle>Analytics Overview</DialogTitle>
              </DialogHeader>

              {isLoadingHighLevelStats ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-gray-400" />
                </div>
              ) : highLevelStats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-500">Total Events</p>
                      <p className="text-2xl font-semibold">
                        {highLevelStats.totalEvents.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-500">Unique Devices</p>
                      <p className="text-2xl font-semibold">
                        {highLevelStats.uniqueDevices.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-500">Unique Countries</p>
                      <p className="text-2xl font-semibold">
                        {highLevelStats.uniqueCountries}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-500">Unique Users</p>
                      <p className="text-2xl font-semibold">
                        {highLevelStats.uniqueUsers.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 font-medium">
                      Device Type Distribution
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Mobile</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{
                                width: `${highLevelStats.deviceTypePercentages.mobile}%`,
                              }}
                            />
                          </div>
                          <span className="w-16 text-right text-sm font-medium">
                            {highLevelStats.deviceTypePercentages.mobile.toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tablet</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{
                                width: `${highLevelStats.deviceTypePercentages.tablet}%`,
                              }}
                            />
                          </div>
                          <span className="w-16 text-right text-sm font-medium">
                            {highLevelStats.deviceTypePercentages.tablet.toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Desktop</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-full rounded-full bg-purple-500"
                              style={{
                                width: `${highLevelStats.deviceTypePercentages.desktop}%`,
                              }}
                            />
                          </div>
                          <span className="w-16 text-right text-sm font-medium">
                            {highLevelStats.deviceTypePercentages.desktop.toFixed(
                              1,
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-3 font-medium">Recipe Extractions</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Attempts</span>
                          <span className="font-medium">
                            {highLevelStats.extractions.attempts.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">Successful</span>
                          <span className="font-medium">
                            {highLevelStats.extractions.successes.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600">Failed</span>
                          <span className="font-medium">
                            {highLevelStats.extractions.errors.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-500">Success Rate</span>
                          <span className="font-medium">
                            {highLevelStats.extractions.successRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h3 className="mb-3 font-medium">Page Views</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Homepage</span>
                          <span className="font-medium">
                            {highLevelStats.pageViews.homepage.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Recipes</span>
                          <span className="font-medium">
                            {highLevelStats.pageViews.recipes.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Extract</span>
                          <span className="font-medium">
                            {highLevelStats.pageViews.extract.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Settings</span>
                          <span className="font-medium">
                            {highLevelStats.pageViews.settings.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Recipe Details</span>
                          <span className="font-medium">
                            {highLevelStats.pageViews.recipeDetail.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {highLevelStats.topCountriesByDevices.length > 0 && (
                    <div className="rounded-lg border p-4">
                      <h3 className="mb-3 font-medium">
                        Top Countries by Devices
                      </h3>
                      <div className="space-y-2 text-sm">
                        {highLevelStats.topCountriesByDevices
                          .slice(0, 10)
                          .map(({ country, deviceCount }, index) => (
                            <div
                              key={country}
                              className="flex items-center justify-between py-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 text-right text-gray-400">
                                  {index + 1}.
                                </span>
                                <span>{country}</span>
                              </div>
                              <span className="font-medium">
                                {deviceCount.toLocaleString()}{" "}
                                <span className="font-normal text-gray-500">
                                  {deviceCount === 1 ? "device" : "devices"}
                                </span>
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 font-medium">Event Type Breakdown</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                      {Object.entries(highLevelStats.eventBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <div
                            key={type}
                            className="flex justify-between rounded bg-gray-50 px-2 py-1 dark:bg-gray-800"
                          >
                            <span className="truncate text-gray-600 dark:text-gray-400">
                              {type}
                            </span>
                            <span className="ml-2 font-medium">
                              {count.toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Failed to load stats
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
