import {
  Box,
  Burger,
  Button,
  Divider,
  Drawer,
  Group,
  Image,
  ScrollArea,
  Menu,
  Avatar,
  Text,
  Stack,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./index.module.css";
import { Link, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { authClient } from "@/lib/client/auth";

const Header = () => {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    closeDrawer();
  }, [location.key]);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/");
  };

  // Only show user info when session is loaded and user exists (after sign in)
  const isLoggedIn = !isPending && session?.user;

  return (
    <Box className={classes.sticky} mb={10}>
      <header className={classes.header}>
        <Group justify="space-between" h="100%" gap="xs" wrap="nowrap">
          <Link to="/" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src="/assets/snaptosell-light.png"
              alt="SnapToSell Logo"
              className={classes.headerLogo}
            />
          </Link>

          <Group h="100%" gap={0} visibleFrom="md" wrap="nowrap">
            <Link to="/" className={classes.link}>
              Home
            </Link>
            <Link to="/features" className={classes.link}>Features</Link>
            <Link to="/how-it-works" className={classes.link}>How It Works</Link>
            <Link to="/scam-database" className={classes.link}>Scam Database</Link>
            <Link to="/waitlist" className={classes.link}>Join Waitlist</Link>
          </Group>

          <Group gap="xs" visibleFrom="md" wrap="nowrap">
            {isLoggedIn ? (
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Group gap="xs" style={{ cursor: "pointer" }} wrap="nowrap">
                    <Avatar size="sm" radius="xl">
                      {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text size="sm" fw={500} visibleFrom="lg">
                      {session.user.name || session.user.email}
                    </Text>
                  </Group>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/detect">
                    Dashboard
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={handleSignOut}>
                    Sign Out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <>
                <Button variant="default" component={Link} to={"/sign-in"} size="sm">
                  Sign In
                </Button>
                <Button component={Link} to={"/register"} size="sm">
                  Register
                </Button>
              </>
            )}
          </Group>

          <Burger
            opened={drawerOpened}
            onClick={toggleDrawer}
            hiddenFrom="md"
            size="sm"
          />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title={
          <Group gap="xs">
            <Image
              src="/assets/snaptosell-light.png"
              alt="SnapToSell"
              w={100}
            />
          </Group>
        }
        hiddenFrom="md"
        zIndex={1000000}
      >
        <ScrollArea h="calc(100vh - 100px)" mx="-md" px="md">
          <Stack gap="xs" mt="md">
            <Link to="/" className={classes.mobileLink} onClick={closeDrawer}>
              Home
            </Link>
            <Link to="/features" className={classes.mobileLink} onClick={closeDrawer}>
              Features
            </Link>
            <Link to="/how-it-works" className={classes.mobileLink} onClick={closeDrawer}>
              How It Works
            </Link>
            <Link to="/scam-database" className={classes.mobileLink} onClick={closeDrawer}>
              Scam Database
            </Link>
            <Link to="/waitlist" className={classes.mobileLink} onClick={closeDrawer}>
              Join Waitlist
            </Link>
          </Stack>

          <Divider my="md" />

          {isLoggedIn ? (
            <Stack gap="md" mt="md">
              <Group gap="sm" p="sm" style={{ borderRadius: 8, backgroundColor: "var(--mantine-color-gray-0)" }}>
                <Avatar size="md" radius="xl">
                  {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>
                    {session.user.name || session.user.email}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {session.user.email}
                  </Text>
                </div>
              </Group>
              <Button
                component={Link}
                to="/detect"
                fullWidth
                onClick={closeDrawer}
                mb="xs"
              >
                Dashboard
              </Button>
              <Button
                variant="light"
                color="red"
                fullWidth
                onClick={() => {
                  handleSignOut();
                  closeDrawer();
                }}
              >
                Sign Out
              </Button>
            </Stack>
          ) : (
            <Stack gap="sm" mt="md">
              <Button
                variant="default"
                component={Link}
                to={"/sign-in"}
                fullWidth
                onClick={closeDrawer}
              >
                Sign In
              </Button>
              <Button
                component={Link}
                to={"/register"}
                fullWidth
                onClick={closeDrawer}
              >
                Register
              </Button>
            </Stack>
          )}
        </ScrollArea>
      </Drawer>
    </Box>
  );
};

export default Header;
