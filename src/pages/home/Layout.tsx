import {
  Box,
  Center,
  Flex,
  HStack,
  Image,
  useColorModeValue,
  VStack,
} from "@hope-ui/solid"
import { Markdown } from "~/components"
import { useTitle } from "~/hooks"
import { getSetting } from "~/store"
import { notify } from "~/utils"
import { Body } from "./Body"
import { Footer } from "./Footer"
import { Header } from "./header/Header"
import { Toolbar } from "./toolbar/Toolbar"
import { SideMenu } from "../manage/SideMenu"
import { side_menu_items } from "../manage/sidemenu_items"
import { SwitchColorMode, SwitchLanguageWhite } from "~/components"
import { Readme } from "~/pages/home/Readme"
import { Nav } from "~/pages/home/Nav"
import { Obj } from "~/pages/home/Obj"
import { Container } from "~/pages/home/Container"

const Index = () => {
  useTitle(getSetting("site_title"))
  const announcement = getSetting("announcement")
  if (announcement) {
    notify.render(<Markdown children={announcement} />)
  }
  return (
    <Box
      css={{
        "--hope-colors-background": "var(--hope-colors-loContrast)",
      }}
      bgColor="$background"
      w="$full"
      h="100vh"
      display="grid"
      gridTemplateColumns="260px 1fr"
    >
      {/* Left sidebar */}
      <Box
        shadow="$md"
        bgColor={useColorModeValue("$background", "$neutral2")()}
        display="grid"
        gridTemplateRows="auto 1fr auto"
        height="100vh"
      >
        <Flex justifyContent="center" p="$2">
          <Image
            src="https://cdn.statically.io/gh/OpenListTeam/Logo/main/OpenList.svg"
            width="64px"
            height="64px"
          />
        </Flex>

        <Box>
          <SideMenu items={side_menu_items} />
        </Box>

        <HStack spacing="$4" p="$2" color="$neutral11" justifyContent="center">
          <SwitchLanguageWhite />
          <SwitchColorMode />
        </HStack>
      </Box>

      <VStack
        class="body"
        mt="$1"
        py="$2"
        px="2%"
        minH="80vh"
        w="80%"
        gap="$4"
        justifyItems="center"
      >
        <Readme files={["header.md", "top.md", "index.md"]} fromMeta="header" />
        <Nav />
        <Obj />
        <Readme
          files={["readme.md", "footer.md", "bottom.md"]}
          fromMeta="readme"
        />
      </VStack>
    </Box>
  )
}

export default Index
