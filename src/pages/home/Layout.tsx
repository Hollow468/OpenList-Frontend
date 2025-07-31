import { Box, Center, Flex, HStack, useColorModeValue } from "@hope-ui/solid"
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
    >
      <Header />
      <Toolbar />
      <Flex w="$full" minH="calc(100vh - 64px - 60px)">
        <Box
          display={{ "@initial": "none", "@sm": "block" }}
          w="$56"
          h="100%"
          shadow="$md"
          bgColor={useColorModeValue("$background", "$neutral2")()}
          overflowY="auto"
        >
          <SideMenu items={side_menu_items} />
          <Center>
            <HStack spacing="$4" p="$2" color="$neutral11">
              <SwitchLanguageWhite />
              <SwitchColorMode />
            </HStack>
          </Center>
        </Box>
        <Box
          w={{
            "@initial": "$full",
            "@sm": "calc(100% - 16rem)",
          }}
          pl="$8"
          pr="$4"
          py="$4"
          overflowY="auto"
        >
          <Body />
        </Box>
      </Flex>
    </Box>
  )
}

export default Index
