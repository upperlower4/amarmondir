import { supabase } from "@/lib/supabase"
async function test() {
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log(session, error)
}
test()
