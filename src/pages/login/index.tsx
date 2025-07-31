import {
  Image,
  Center,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  useColorModeValue,
  HStack,
  VStack,
  Checkbox,
  Icon,
  Stack,
} from "@hope-ui/solid"

import { createMemo, createSignal, Show, onMount, onCleanup } from "solid-js"
import { SwitchColorMode, SwitchLanguageWhite } from "~/components"
import { useFetch, useT, useTitle, useRouter } from "~/hooks"
import {
  changeToken,
  r,
  notify,
  handleRespWithoutNotify,
  base_path,
  handleResp,
  hashPwd,
} from "~/utils"
import { PResp, Resp } from "~/types"

import { createStorageSignal } from "@solid-primitives/storage"
import { getSetting, getSettingBool } from "~/store"
import { SSOLogin } from "./SSOLogin"
import { IoFingerPrint } from "solid-icons/io"
import {
  parseRequestOptionsFromJSON,
  get,
  AuthenticationPublicKeyCredential,
  supported,
  CredentialRequestOptionsJSON,
} from "@github/webauthn-json/browser-ponyfill"
import "./index.css"
import { fonts } from "@hope-ui/solid/dist/styled-system/tokens/typography"

const Login = () => {
  const logos = getSetting("logo").split("\n")
  const logo = useColorModeValue(logos[0], logos.pop())
  const t = useT()
  const title = createMemo(() => {
    return `${t("login.login_to")} ${getSetting("site_title")}`
  })
  useTitle(title)
  const bgColor = useColorModeValue("white", "$neutral1")
  const [username, setUsername] = createSignal(
    localStorage.getItem("username") || "",
  )
  const [password, setPassword] = createSignal(
    localStorage.getItem("password") || "",
  )
  const [opt, setOpt] = createSignal("")
  const [useauthn, setuseauthn] = createSignal(false)
  const [remember, setRemember] = createStorageSignal("remember-pwd", "false")
  const [useLdap, setUseLdap] = createSignal(false)
  const [loading, data] = useFetch(
    async (): Promise<Resp<{ token: string }>> => {
      if (useLdap()) {
        return r.post("/auth/login/ldap", {
          username: username(),
          password: password(),
          otp_code: opt(),
        })
      } else {
        return r.post("/auth/login/hash", {
          username: username(),
          password: hashPwd(password()),
          otp_code: opt(),
        })
      }
    },
  )
  const [, postauthnlogin] = useFetch(
    (
      session: string,
      credentials: AuthenticationPublicKeyCredential,
      username: string,
      signal: AbortSignal | undefined,
    ): Promise<Resp<{ token: string }>> =>
      r.post(
        "/authn/webauthn_finish_login?username=" + username,
        JSON.stringify(credentials),
        {
          headers: {
            session: session,
          },
          signal,
        },
      ),
  )
  interface Webauthntemp {
    session: string
    options: CredentialRequestOptionsJSON
  }
  const [, getauthntemp] = useFetch(
    (username, signal: AbortSignal | undefined): PResp<Webauthntemp> =>
      r.get("/authn/webauthn_begin_login?username=" + username, {
        signal,
      }),
  )
  const { searchParams, to } = useRouter()
  const isAuthnConditionalAvailable = async (): Promise<boolean> => {
    if (
      PublicKeyCredential &&
      "isConditionalMediationAvailable" in PublicKeyCredential
    ) {
      // @ts-expect-error
      return await PublicKeyCredential.isConditionalMediationAvailable()
    } else {
      return false
    }
  }
  const AuthnSignEnabled = getSettingBool("webauthn_login_enabled")
  const AuthnSwitch = async () => {
    setuseauthn(!useauthn())
  }
  let AuthnSignal: AbortController | null = null
  const AuthnLogin = async (conditional?: boolean) => {
    if (!supported()) {
      if (!conditional) {
        notify.error(t("users.webauthn_not_supported"))
      }
      return
    }
    if (conditional && !(await isAuthnConditionalAvailable())) {
      return
    }
    AuthnSignal?.abort()
    const controller = new AbortController()
    AuthnSignal = controller
    const username_login: string = conditional ? "" : username()
    if (!conditional && remember() === "true") {
      localStorage.setItem("username", username())
    } else {
      localStorage.removeItem("username")
    }
    const resp = await getauthntemp(username_login, controller.signal)
    handleResp(resp, async (data) => {
      try {
        const options = parseRequestOptionsFromJSON(data.options)
        options.signal = controller.signal
        if (conditional) {
          // @ts-expect-error
          options.mediation = "conditional"
        }
        const credentials = await get(options)
        const resp = await postauthnlogin(
          data.session,
          credentials,
          username_login,
          controller.signal,
        )
        handleRespWithoutNotify(resp, (data) => {
          notify.success(t("login.success"))
          changeToken(data.token)
          to(
            decodeURIComponent(searchParams.redirect || base_path || "/"),
            true,
          )
        })
      } catch (error: unknown) {
        if (error instanceof Error && error.name != "AbortError")
          notify.error(error.message)
      }
    })
  }
  const AuthnCleanUpHandler = () => AuthnSignal?.abort()
  onMount(() => {
    if (AuthnSignEnabled) {
      window.addEventListener("beforeunload", AuthnCleanUpHandler)
      AuthnLogin(true)
    }
  })
  onCleanup(() => {
    AuthnSignal?.abort()
    window.removeEventListener("beforeunload", AuthnCleanUpHandler)
  })

  const Login = async () => {
    if (!useauthn()) {
      if (remember() === "true") {
        localStorage.setItem("username", username())
        localStorage.setItem("password", password())
      } else {
        localStorage.removeItem("username")
        localStorage.removeItem("password")
      }
      const resp = await data()
      handleRespWithoutNotify(
        resp,
        (data) => {
          notify.success(t("login.success"))
          changeToken(data.token)
          to(
            decodeURIComponent(searchParams.redirect || base_path || "/"),
            true,
          )
        },
        (msg, code) => {
          if (!needOpt() && code === 402) {
            setNeedOpt(true)
          } else {
            notify.error(msg)
          }
        },
      )
    } else {
      await AuthnLogin()
    }
  }
  const [needOpt, setNeedOpt] = createSignal(false)
  const ldapLoginEnabled = getSettingBool("ldap_login_enabled")
  const ldapLoginTips = getSetting("ldap_login_tips")
  if (ldapLoginEnabled) {
    setUseLdap(true)
  }

  return (
    <Center zIndex="1" h="100vh">
      <VStack
        bgColor={bgColor()}
        rounded="$xl"
        p="29px"
        h="590px"
        w="585px"
        borderRadius="4px"
        spacing="$4"
        boxShadow="0px 4px 20px rgba(0, 0, 0, 0.1)"
      >
        <Flex alignItems="center" justifyContent="space-around">
          <Heading color="$info" fontSize="$2xl" mb="$4">
            <div style={{ height: "20px" }} />
            {title()}
          </Heading>
        </Flex>
        <Show
          when={!needOpt()}
          fallback={
            <Input
              id="totp"
              name="otp"
              placeholder={t("login.otp-tips")}
              value={opt()}
              onInput={(e) => setOpt(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  Login()
                }
              }}
            />
          }
        >
          <Input
            name="username"
            class="input"
            placeholder={t("login.username-tips")}
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
          />
          <Show when={!useauthn()}>
            <Input
              name="password"
              class="input"
              placeholder={t("login.password-tips")}
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  Login()
                }
              }}
            />
          </Show>
          <Flex
            px="$1"
            w="400px"
            fontSize="$sm"
            color="$neutral10"
            justifyContent="space-between"
            alignItems="center"
          >
            <Checkbox
              checked={remember() === "true"}
              onChange={() =>
                setRemember(remember() === "true" ? "false" : "true")
              }
            >
              {t("login.remember")}
            </Checkbox>
          </Flex>
        </Show>

        <Stack alignItems="center" justifyContent="left" gap="12px">
          <p>{t("login.other")}</p>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="280"
            height="2"
            viewBox="0 0 304 2"
            fill="none"
          >
            <line y1="1" x2="304" y2="1" stroke="#E7E7E7" stroke-width="2" />
          </svg>
        </Stack>

        <Flex>
          <Button class="opt">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              viewBox="0 0 1024 1024"
              p-id="3598"
              width="46"
              height="45"
            >
              <path
                d="M168 83.2L438.4 8c46.4-11.2 97.6-11.2 148.8 0l270.4 75.2c51.2 11.2 86.4 57.6 86.4 108.8v315.2c0 206.4-126.4 395.2-321.6 470.4L512 1024l-108.8-46.4C208 904 81.6 713.6 81.6 507.2V192c0-51.2 35.2-97.6 86.4-108.8zM512 937.6l80-33.6c161.6-62.4 270.4-220.8 270.4-395.2V192c0-12.8-8-27.2-24-30.4-1.6 0-3.2 0-3.2-1.6L568 86.4C547.2 81.6 528 80 510.4 80s-35.2 1.6-52.8 6.4L188.8 160c-1.6 0-3.2 0-3.2 1.6-16 3.2-24 17.6-24 30.4v315.2c0 174.4 108.8 334.4 270.4 395.2 1.6 0 1.6 0 3.2 1.6l76.8 33.6z"
                fill="#0088FF"
                p-id="3599"
              />
              <path
                d="M664 531.2c16-16 43.2-16 59.2 0s16 43.2 0 59.2l-136 136c-16 16-43.2 16-59.2 0s-16-43.2 0-59.2l136-136z m-54.4-174.4c16-16 43.2-16 59.2 0s16 43.2 0 59.2L419.2 667.2c-16 16-43.2 16-59.2 0s-16-43.2 0-59.2l249.6-251.2z m-174.4-60.8c16-16 43.2-16 59.2 0s16 43.2 0 59.2l-136 131.2c-16 16-43.2 16-59.2 0s-16-43.2 0-59.2l136-131.2z"
                fill="#8BD5FF"
                p-id="3600"
              />
            </svg>
          </Button>
        </Flex>

        <div style={{ height: "15px" }}></div>

        <HStack w="400px" spacing="$3" justifyContent="center">
          <Button w="$full" class="login" loading={loading()} onClick={Login}>
            {t("login.login")}
          </Button>
        </HStack>
        <Show when={ldapLoginEnabled}>
          <Checkbox
            w="$full"
            checked={useLdap() === true}
            onChange={() => setUseLdap(!useLdap())}
          >
            {ldapLoginTips}
          </Checkbox>
        </Show>

        <Flex
          mt="$2"
          justifyContent="space-evenly"
          alignItems="center"
          color="$neutral10"
          w="$full"
        >
          <Show when={AuthnSignEnabled}>
            <Icon
              cursor="pointer"
              boxSize="$8"
              as={IoFingerPrint}
              p="$0_5"
              onclick={AuthnSwitch}
            />
          </Show>
        </Flex>
      </VStack>
    </Center>
  )
}

export default Login
