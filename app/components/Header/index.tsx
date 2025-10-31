import {
  Box,
  Burger,
  Button,
  Divider,
  Drawer,
  Group,
  Image,
  ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./index.module.css";
import { Link, useLocation } from "react-router";
import { useEffect } from "react";

const Header = () => {
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);

  const location = useLocation();

  useEffect(() => {
    closeDrawer();
  }, [location.key]);

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
            <Link to="#features" className={classes.link}>
              Features
            </Link>
            <Link to="#how-it-works" className={classes.link}>
              How It Works
            </Link>
            <Link to="#scam-database" className={classes.link}>
              Scam Database
            </Link>
            <Link to="#waitlist" className={classes.link}>
              Join Waitlist
            </Link>
          </Group>

          <Group visibleFrom="md">
            <Button variant="default" component={Link} to={"/sign-in"}>
              Sign In
            </Button>
            <Button component={Link} to={"/register"}>
              Register
            </Button>
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
          <Divider my="sm" />

          <Link to="/" className={classes.link}>
            Home
          </Link>
          <Link to="#features" className={classes.link}>
            Features
          </Link>
          <Link to="#how-it-works" className={classes.link}>
            How It Works
          </Link>
          <Link to="#scam-database" className={classes.link}>
            Scam Database
          </Link>
          <Link to="#waitlist" className={classes.link}>
            Join Waitlist
          </Link>

          <Divider my="sm" />

          <Group justify="center" grow pb="xl" px="md">
            <Button variant="default" component={Link} to={"/sign-in"}>
              Sign In
            </Button>
            <Button component={Link} to={"/register"}>
              Register
            </Button>
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
};

export default Header;
