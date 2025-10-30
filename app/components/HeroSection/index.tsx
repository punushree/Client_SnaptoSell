import { Button, Center, Chip, Container, Text, Title } from "@mantine/core";
import { Dots } from "./Dots";
import classes from "./index.module.css";

const HeroSection = () => {
  return (
    <>
      <Center>
        <Chip checked={false} variant="filled">
          Beta Launching Soon
        </Chip>
      </Center>
      <Container className={classes.wrapper} size={1400}>
        <Dots className={classes.dots} style={{ left: 0, top: 0 }} />
        <Dots className={classes.dots} style={{ left: 60, top: 0 }} />
        <Dots className={classes.dots} style={{ left: 0, top: 140 }} />
        <Dots className={classes.dots} style={{ right: 0, top: 60 }} />
        <div className={classes.inner}>
          <Title className={classes.title}>
            Never Get Scammed on a&nbsp;
            <Text component="span" className={classes.highlight} inherit>
              Marketplace Again
            </Text>
          </Title>
          <Container p={0} size={600}>
            <Text size="lg" c="dimmed" className={classes.description}>
              AI-powered fraud detection meets instant item pricing. Sell
              safely, sell smarter, sell faster.
            </Text>
          </Container>
          <div className={classes.controls}>
            <Button
              className={classes.control}
              size="lg"
              variant="default"
              color="gray"
            >
              Book a demo
            </Button>
            <Button className={classes.control} size="lg">
              Purchase a license
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
};

export default HeroSection;
