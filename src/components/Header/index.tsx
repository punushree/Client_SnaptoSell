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
        <Group justify="space-between" h="100%">
          <Link to="/">
            <Image
              src="/assets/snaptosell-light.png"
              alt=""
              className={classes.headerLogo}
            />
          </Link>

          <Group h="100%" gap={0} visibleFrom="md">
            <Link to="/" className={classes.link}>
              Home
            </Link>

            <Link to="/features" className={classes.link}>Features</Link>
            <Link to="/how-it-works" className={classes.link}>How It Works</Link>
            <Link to="/scam-database" className={classes.link}>Scam Database</Link>
            <Link to="/waitlist" className={classes.link}>Join Waitlist</Link>
      
          </Group>


          <Group visibleFrom="md">
            {isLoggedIn ? (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Group gap="xs" style={{ cursor: "pointer" }}>
                    <Avatar size="sm" radius="xl">
                      {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text size="sm" fw={500}>
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
                <Button variant="default" component={Link} to={"/sign-in"}>
                  Sign In
                </Button>
                <Button component={Link} to={"/register"}>
                  Register
                </Button>
              </>
            )}
          </Group>

          <Burger
            opened={drawerOpened}
            onClick={toggleDrawer}
            hiddenFrom="md"
          />
        </Group>
      </header>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h="calc(100vh - 80px" mx="-md">
          {/*<Divider my="sm" />

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
          </Link> */}

          {/* <Link to="/feature" className={classes.link}>Features</Link>
          <Link to="/howItWorks" className={classes.link}>How It Works</Link>
          <Link to="/scamDatabase" className={classes.link}>Scam Database</Link>
          <Link to="/waitlist" className={classes.link}>Join Waitlist</Link>

          <Divider my="sm" /> */}

          <Group justify="center" grow pb="xl" px="md">
            {isLoggedIn ? (
              <Group justify="center" w="100%">
                <Avatar size="sm" radius="xl">
                  {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
                </Avatar>
                <Text size="sm" fw={500}>
                  {session.user.name || session.user.email}
                </Text>
                <Button variant="default" onClick={handleSignOut} fullWidth>
                  Sign Out
                </Button>
              </Group>
            ) : (
              <>
                <Button variant="default" component={Link} to={"/sign-in"}>
                  Sign In
                </Button>
                <Button component={Link} to={"/register"}>
                  Register
                </Button>
              </>
            )}
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
};

export default Header;
