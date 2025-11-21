import {
  Box,
  Burger,
  Button,
  Drawer,
  Group,
  Image,
  Menu,
  Avatar,
  Text,
  Stack,
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSun, IconMoon } from "@tabler/icons-react";
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

  const { setColorScheme, colorScheme } = useMantineColorScheme({
    keepTransitions: false,
  });
  const computedColorScheme = useComputedColorScheme("light");

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    closeDrawer();
  }, [location.key]);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/");
  };

  // Only show user info when session is loaded and user exists (after sign in)
  const isLoggedIn = !isPending && session?.user;

  const ColorSchemeToggle = () => {
    return (
      <ActionIcon
        onClick={toggleColorScheme}
        variant="default"
        size="lg"
        aria-label="Toggle color scheme"
      >
        {computedColorScheme === "dark" ? (
          <IconSun size={18} />
        ) : (
          <IconMoon size={18} />
        )}
      </ActionIcon>
    );
  };

  return (
    <Box className={classes.sticky} mb={10}>
      <header className={classes.header}>
        <Group justify="space-between" h="100%" gap="xs" wrap="nowrap">
          <Link to="/" style={{ display: "flex", alignItems: "center" }}>
            <Image
              src={`/assets/snaptosell-${colorScheme === "light" ? "light" : colorScheme === "dark" ? "dark" : computedColorScheme === "dark" ? "dark" : "light"}.png`}
              alt="SnapToSell Logo"
              className={classes.headerLogo}
            />
          </Link>

          <Group h="100%" gap={0} visibleFrom="md" wrap="nowrap">
            <Link to="/" className={classes.link}>
              Home
            </Link>
            <Link to="/features" className={classes.link}>
              Features
            </Link>
            <Link to="/how-it-works" className={classes.link}>
              How It Works
            </Link>
            <Link to="/scam-database" className={classes.link}>
              Scam Database
            </Link>
            <Link to="/waitlist" className={classes.link}>
              Join Waitlist
            </Link>
          </Group>

          <Group gap="xs" visibleFrom="md" wrap="nowrap">
            <ColorSchemeToggle />
            {isLoggedIn ? (
              <Menu shadow="md" width={200} position="bottom-end">
                <Menu.Target>
                  <Group gap="xs" style={{ cursor: "pointer" }} wrap="nowrap">
                    <Avatar size="sm" radius="xl">
                      {session.user.name?.charAt(0).toUpperCase() ||
                        session.user.email?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text size="sm" fw={500} visibleFrom="lg">
                      {session.user.name || session.user.email}
                    </Text>
                  </Group>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/detect">
                    New Detection
                  </Menu.Item>
                  <Menu.Item component={Link} to="/my-detections">
                    My Detections
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={handleSignOut}>
                    Sign Out
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <>
                <Button
                  variant="default"
                  component={Link}
                  to={"/sign-in"}
                  size="sm"
                >
                  Sign In
                </Button>
                <Button component={Link} to={"/register"} size="sm">
                  Register
                </Button>
              </>
            )}
          </Group>

          <Group hiddenFrom="md">
            <ColorSchemeToggle />
            <Burger opened={drawerOpened} onClick={toggleDrawer} size="sm" />
          </Group>
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
        {isLoggedIn ? (
          <Stack gap="md" mt="md">
            {/* User Profile Section - Shows First */}
            <Group
              gap="sm"
              p="sm"
              style={{
                borderRadius: 8,
                backgroundColor: "var(--mantine-color-gray-0)",
              }}
            >
              <Avatar size="md" radius="xl">
                {session.user.name?.charAt(0).toUpperCase() ||
                  session.user.email?.charAt(0).toUpperCase()}
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

            <Stack gap="2px" mt="2%">
              <Link to="/" className={classes.mobileLink} onClick={closeDrawer}>
                Home
              </Link>
              <Link
                to="/features"
                className={classes.mobileLink}
                onClick={closeDrawer}
              >
                Features
              </Link>
              <Link
                to="/how-it-works"
                className={classes.mobileLink}
                onClick={closeDrawer}
              >
                How It Works
              </Link>
              <Link
                to="/scam-database"
                className={classes.mobileLink}
                onClick={closeDrawer}
              >
                Scam Database
              </Link>
            </Stack>

            <Button
              component={Link}
              to="/detect"
              fullWidth
              onClick={closeDrawer}
              mb="xs"
            >
              New Detection
            </Button>
            <Button
              component={Link}
              to="/my-detections"
              variant="light"
              fullWidth
              onClick={closeDrawer}
              mb="xs"
            >
              My Detections
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
          <>
            <Stack gap="1px" mt="2%">
              <Link to="/" className={classes.mobileLink} onClick={closeDrawer}>
                Home
              </Link>
              <Link
                to="/features"
                className={classes.mobileLink}
                onClick={closeDrawer}
              >
                Features
              </Link>
              <Link
                to="/how-it-works"
                className={classes.mobileLink}
                onClick={closeDrawer}
              >
                How It Works
              </Link>
              <Link
                to="/scam-database"
                className={classes.mobileLink}
                onClick={closeDrawer}
              >
                Scam Database
              </Link>
            </Stack>

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
          </>
        )}
      </Drawer>
    </Box>
  );
};

export default Header;
