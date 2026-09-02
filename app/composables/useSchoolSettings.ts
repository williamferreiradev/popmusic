export type SchoolSettings = { nome:string; cnpj:string; endereco:string; telefone:string; email:string; pix_chave:string; email_remetente:string }

export const useSchoolSettings = () => {
  const supabase = useSupabaseClient()
  const school = useState<SchoolSettings>('school-settings', () => ({ nome:'Pop Music',cnpj:'',endereco:'',telefone:'',email:'',pix_chave:'',email_remetente:'' }))
  const loaded = useState<boolean>('school-settings-loaded', () => false)
  const loadSchool = async () => {
    if (loaded.value) return school.value
    const { data, error } = await supabase.from('configuracoes').select('valor').eq('chave','escola').maybeSingle()
    if (!error && data?.valor) school.value = { ...school.value, ...(data.valor as any) }
    loaded.value = true
    return school.value
  }
  return { school, loadSchool }
}
