application: statistical_process_control {
  label: "Statistical Process Control"
  url: "https://cdn.lkr.dev/apps/statistical-process-control/latest/bundle.js"
  entitlements: {
    core_api_methods: ["me", "lookml_model_explore", "all_lookml_models"]
    use_embeds:  yes
    use_iframes: yes
  }
}

constant: CONNECTION_NAME {
  value: "looker-private-demo"
  export: override_required
}