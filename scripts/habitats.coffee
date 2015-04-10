ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
d3 = window.d3
_partials = require 'api/templates'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class HabitatsTab extends ReportTab
  name: 'Habitats'
  className: 'habitats'
  template: templates.habitats
  dependencies:[ 
    'Habitat'
  ]

  render: () ->
    sketch_habitats = @recordSet('Habitat', 'SketchHabitats')
    proposal_habitats = @recordSet('Habitat', 'ProposalHabitats')
    MIXED_USE_ZONE = "mixed_use"
    SUSTAINABLE_ZONE = "sustainable_use"
    EXTRACTIVE_ZONE = "non_extractive_use"
    INTANGIBLE_ZONE = "intangible"

    try
      isSketch = true
      sketch_habitats = sketch_habitats.toArray()
    catch err
      
      isSketch = false
      proposal_habitats = proposal_habitats.toArray()
      mixed_use_habitats = @sortProposalValues(proposal_habitats, MIXED_USE_ZONE)
      hasMixedUse = mixed_use_habitats?.length > 0

      intangible_habitats = @sortProposalValues(proposal_habitats, INTANGIBLE_ZONE)
      hasIntangibles = intangible_habitats?.length > 0

      extractive_habitats = @sortProposalValues(proposal_habitats, EXTRACTIVE_ZONE)
      hasExtractive = extractive_habitats?.length > 0

      sustainable_habitats = @sortProposalValues(proposal_habitats, SUSTAINABLE_ZONE)
      hasSustainable = sustainable_habitats?.length > 0

    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      isSketch: isSketch
      sketch_habitats: sketch_habitats

      hasMixedUse: hasMixedUse
      mixed_use_habitats: mixed_use_habitats
      hasIntangibles: hasIntangibles
      intangible_habitats: intangible_habitats
      hasExtractive: hasExtractive
      extractive_habitats: extractive_habitats
      hasSustainable: hasSustainable
      sustainable_habitats: sustainable_habitats


    @$el.html @template.render(context, partials)
    @$('.chosen').chosen({disable_search_threshold: 10, width:'400px'})
    @$('.chosen').change () =>
      _.defer @renderTradeoffs

  sortProposalValues: (proposal_values, type) =>
    results = []
    for pv in proposal_values
      if pv.ZONE_TYPE == type
        results.push(pv)
    return results

module.exports = HabitatsTab