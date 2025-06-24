"use client";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "ui/dropdown-menu";
import { DropdownMenuContent } from "ui/dropdown-menu";
import { AvatarFallback } from "ui/avatar";
import { AvatarImage } from "ui/avatar";
import { SidebarMenuButton } from "ui/sidebar";
import { DropdownMenuTrigger } from "ui/dropdown-menu";
import { DropdownMenu } from "ui/dropdown-menu";
import { SidebarMenuItem } from "ui/sidebar";
import { SidebarMenu } from "ui/sidebar";
import { Avatar } from "ui/avatar";
import { ChevronsUpDown, Command, LogOutIcon, Settings2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { appStore } from "@/app/store";

export function AppSidebarUser() {
  const { data: session } = useSession();

  const user = session?.user;
  const appStoreMutate = appStore((state) => state.mutate);

  const logout = () => {
    signOut({
      redirectTo: "/login",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size={"lg"}
            >
              <Avatar className="rounded-full size-7 grayscale">
                <AvatarImage
                  className="object-cover"
                  src={user.image || "/pf.png"}
                  alt={user.name || ""}
                />
                <AvatarFallback>{user.name?.slice(0, 1) || ""}</AvatarFallback>
              </Avatar>
              {user.email}
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="bg-background w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-lg"
            align="center"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={user.image || "/pf.png"}
                    alt={user.name || ""}
                  />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => appStoreMutate({ openChatPreferences: true })}
            >
              <Settings2 className="size-4 text-foreground" />
              <span>Chat Preferences </span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => appStoreMutate({ openShortcutsPopup: true })}
            >
              <Command className="size-4 text-foreground" />
              <span>Keyboard Shortcuts</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOutIcon className="size-4 text-foreground" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
