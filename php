<?php
/**
 * Mahal — Custom Post Types (v1.1)
 * ------------------------------------------------------------------
 * HOW TO USE
 * Option A (recommended): Create a small site-specific plugin.
 *   1. Create /wp-content/plugins/mahall-cpt/mahall-cpt.php
 *   2. Add the plugin header below, then paste everything after it.
 *   3. Activate the plugin in WP Admin → Plugins.
 *   This survives theme changes.
 *
 * Option B: Paste into your child theme's functions.php.
 *
 * PLUGIN HEADER (use only for Option A):
 * ---
 * Plugin Name:  Mahal Custom Post Types
 * Description:  Registers mahall_venue and mahall_lead CPTs with meta boxes and admin tooling.
 * Version:      1.0.0
 * Author:       Mahal
 * ---
 *
 * WHAT THIS FILE DOES
 * 1. Registers mahall_venue CPT (venues) + mahall_lead CPT (leads)
 * 2. Registers mahall_category taxonomy (the 8 venue categories)
 * 3. Adds admin columns for quick scanning (city, plan, status, lead count)
 * 4. Adds meta boxes on the venue edit screen for all fields
 * 5. Adds meta boxes on the lead edit screen for inquiry details
 * 6. Generates a /wp-json/mahall/v1/owner/plan endpoint stub
 * 7. Adds a Tools → Export Venues JSON page for Mode B of the AI proxy
 * 8. Flushes rewrite rules on activation so venue URLs work immediately
 * ------------------------------------------------------------------
 */

if ( ! defined( 'ABSPATH' ) ) exit;

/* ================================================================
   1. REGISTER CPTs
================================================================ */

add_action( 'init', 'mahall_register_post_types' );
function mahall_register_post_types() {

    /* ---- mahall_venue ---- */
    register_post_type( 'mahall_venue', array(
        'labels' => array(
            'name'               => 'Venues',
            'singular_name'      => 'Venue',
            'add_new'            => 'Add venue',
            'add_new_item'       => 'Add new venue',
            'edit_item'          => 'Edit venue',
            'new_item'           => 'New venue',
            'view_item'          => 'View venue',
            'search_items'       => 'Search venues',
            'not_found'          => 'No venues found',
            'not_found_in_trash' => 'No venues in trash',
            'all_items'          => 'All venues',
            'menu_name'          => 'Venues',
        ),
        'public'              => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_rest'        => true, /* Gutenberg + REST API */
        'show_in_menu'        => true,
        'menu_position'       => 5,
        'menu_icon'           => 'dashicons-building',
        'capability_type'     => 'post',
        'has_archive'         => true,
        'rewrite'             => array( 'slug' => 'venues', 'with_front' => false ),
        'supports'            => array( 'title', 'editor', 'thumbnail', 'revisions' ),
        'query_var'           => true,
    ) );

    /* ---- mahall_lead ---- */
    register_post_type( 'mahall_lead', array(
        'labels' => array(
            'name'          => 'Leads',
            'singular_name' => 'Lead',
            'all_items'     => 'All leads',
            'edit_item'     => 'Lead details',
            'menu_name'     => 'Leads',
        ),
        'public'          => false,
        'show_ui'         => true,
        'show_in_menu'    => true,
        'menu_position'   => 6,
        'menu_icon'       => 'dashicons-email-alt',
        'capability_type' => 'post',
        'has_archive'     => false,
        'supports'        => array( 'title' ),
        'rewrite'         => false,
    ) );
}

/* ================================================================
   2. REGISTER TAXONOMY — mahall_category
================================================================ */

add_action( 'init', 'mahall_register_taxonomies' );
function mahall_register_taxonomies() {
    register_taxonomy( 'mahall_category', 'mahall_venue', array(
        'labels' => array(
            'name'          => 'Venue categories',
            'singular_name' => 'Category',
            'edit_item'     => 'Edit category',
            'add_new_item'  => 'Add category',
            'menu_name'     => 'Categories',
        ),
        'hierarchical'      => true,
        'show_ui'           => true,
        'show_in_rest'      => true,
        'show_admin_column' => true,
        'rewrite'           => array( 'slug' => 'venue-category' ),
    ) );
}

add_action( 'init', 'mahall_seed_categories' );
function mahall_seed_categories() {
    /* Only runs once — if terms already exist, skip */
    if ( term_exists( 'Heritage & cultural', 'mahall_category' ) ) return;
    $categories = array(
        'heritage'      => 'Heritage & cultural',
        'resort'        => 'Hospitality & resort',
        'private'       => 'Private & exclusive',
        'nature'        => 'Nature & adventure',
        'coastal'       => 'Coastal & leisure',
        'urban'         => 'Urban & lifestyle',
        'corporate'     => 'Corporate & MICE',
        'entertainment' => 'Entertainment & production',
    );
    foreach ( $categories as $slug => $name ) {
        if ( ! term_exists( $slug, 'mahall_category' ) ) {
            wp_insert_term( $name, 'mahall_category', array( 'slug' => $slug ) );
        }
    }
}

/* ================================================================
   3. VENUE ADMIN COLUMNS
================================================================ */

add_filter( 'manage_mahall_venue_posts_columns', 'mahall_venue_columns' );
function mahall_venue_columns( $cols ) {
    $new = array();
    $new['cb']             = $cols['cb'];
    $new['title']          = 'Venue name';
    $new['mahall_city']    = 'City';
    $new['mahall_cat']     = 'Category';
    $new['mahall_cap']     = 'Capacity';
    $new['mahall_price']   = 'From (MAD)';
    $new['mahall_plan']    = 'Plan';
    $new['mahall_leads']   = 'Leads';
    $new['mahall_status']  = 'Status';
    $new['date']           = 'Submitted';
    return $new;
}

add_action( 'manage_mahall_venue_posts_custom_column', 'mahall_venue_column_data', 10, 2 );
function mahall_venue_column_data( $col, $post_id ) {
    switch ( $col ) {
        case 'mahall_city':
            echo esc_html( get_post_meta( $post_id, 'mahall_city', true ) ?: '—' );
            break;
        case 'mahall_cat':
            $terms = get_the_terms( $post_id, 'mahall_category' );
            echo $terms ? esc_html( $terms[0]->name ) : '—';
            break;
        case 'mahall_cap':
            $cap = get_post_meta( $post_id, 'mahall_capacity', true );
            echo $cap ? esc_html( number_format( (int) $cap ) ) : '—';
            break;
        case 'mahall_price':
            $p = get_post_meta( $post_id, 'mahall_price_from', true );
            echo $p ? esc_html( number_format( (int) $p ) ) : '—';
            break;
        case 'mahall_plan':
            $plan = get_post_meta( $post_id, 'mahall_plan', true ) ?: 'free';
            $colours = array( 'free' => '#6b6b6b', 'featured' => '#B5722A', 'premium' => '#2F6F62' );
            $colour  = $colours[ $plan ] ?? '#6b6b6b';
            printf(
                '<span style="color:%s;font-weight:600;text-transform:capitalize;">%s</span>',
                esc_attr( $colour ), esc_html( $plan )
            );
            break;
        case 'mahall_leads':
            $count = get_posts( array(
                'post_type'      => 'mahall_lead',
                'post_status'    => 'any',
                'posts_per_page' => -1,
                'fields'         => 'ids',
                'meta_query'     => array( array(
                    'key'   => 'venue',
                    'value' => get_the_title( $post_id ),
                ) ),
            ) );
            echo count( $count );
            break;
        case 'mahall_status':
            $status = get_post_status( $post_id );
            $labels = array(
                'publish' => '<span style="color:#3F8172">&#9679; Live</span>',
                'pending' => '<span style="color:#B5722A">&#9711; Pending</span>',
                'draft'   => '<span style="color:#736C61">&#9675; Draft</span>',
                'private' => '<span style="color:#B5532D">&#8854; Suspended</span>',
            );
            echo $labels[ $status ] ?? esc_html( $status );
            break;
    }
}

/* Make columns sortable */
add_filter( 'manage_edit-mahall_venue_sortable_columns', function( $cols ) {
    $cols['mahall_city']  = 'mahall_city';
    $cols['mahall_plan']  = 'mahall_plan';
    $cols['mahall_leads'] = 'mahall_leads';
    return $cols;
} );

/* ================================================================
   4. VENUE META BOXES
================================================================ */

add_action( 'add_meta_boxes', 'mahall_add_venue_meta_boxes' );
function mahall_add_venue_meta_boxes() {
    add_meta_box(
        'mahall_venue_details',
        'Venue details',
        'mahall_venue_details_cb',
        'mahall_venue',
        'normal',
        'high'
    );
    add_meta_box(
        'mahall_venue_media',
        'Media & subscription',
        'mahall_venue_media_cb',
        'mahall_venue',
        'side',
        'default'
    );
}

function mahall_venue_details_cb( $post ) {
    wp_nonce_field( 'mahall_venue_save', 'mahall_venue_nonce' );
    $fields = array(
        'mahall_city'        => array( 'label' => 'City / region', 'type' => 'text', 'placeholder' => 'e.g. Marrakech' ),
        'mahall_area'        => array( 'label' => 'Area / neighbourhood', 'type' => 'text', 'placeholder' => 'e.g. Medina' ),
        'mahall_capacity'    => array( 'label' => 'Max capacity (guests)', 'type' => 'number', 'placeholder' => '80' ),
        'mahall_price_from'  => array( 'label' => 'Starting price (MAD)', 'type' => 'number', 'placeholder' => '4000' ),
        'mahall_host_name'   => array( 'label' => 'Host / contact name', 'type' => 'text', 'placeholder' => 'Amina K.' ),
        'mahall_host_email'  => array( 'label' => 'Host email (for lead notifications)', 'type' => 'email', 'placeholder' => 'amina@example.com' ),
        'mahall_host_phone'  => array( 'label' => 'Host WhatsApp / phone', 'type' => 'text', 'placeholder' => '+212 6...' ),
        'mahall_rooms'       => array( 'label' => 'Number of rooms (if applicable)', 'type' => 'number', 'placeholder' => '12' ),
        'mahall_size'        => array( 'label' => 'Total size (m²)', 'type' => 'text', 'placeholder' => '650 m²' ),
        'mahall_amenities'   => array( 'label' => 'Amenities (one per line)', 'type' => 'textarea', 'placeholder' => "Rooftop terrace\nCentral courtyard\nCatering option" ),
        'mahall_video_url'   => array( 'label' => 'Video URL (YouTube / Vimeo)', 'type' => 'url', 'placeholder' => 'https://youtube.com/watch?v=...' ),
        'mahall_tour_url'    => array( 'label' => '3D tour embed URL (Matterport / Kuula)', 'type' => 'url', 'placeholder' => 'https://my.matterport.com/show/?m=...' ),
    );
    echo '<table class="form-table" style="width:100%;">';
    foreach ( $fields as $key => $f ) {
        $val = get_post_meta( $post->ID, $key, true );
        echo '<tr><th style="width:200px;padding:8px 12px;vertical-align:top;"><label for="' . esc_attr( $key ) . '">' . esc_html( $f['label'] ) . '</label></th>';
        echo '<td style="padding:8px 12px;">';
        if ( $f['type'] === 'textarea' ) {
            echo '<textarea id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" rows="4" style="width:100%;max-width:500px;" placeholder="' . esc_attr( $f['placeholder'] ) . '">' . esc_textarea( $val ) . '</textarea>';
        } else {
            echo '<input type="' . esc_attr( $f['type'] ) . '" id="' . esc_attr( $key ) . '" name="' . esc_attr( $key ) . '" value="' . esc_attr( $val ) . '" placeholder="' . esc_attr( $f['placeholder'] ) . '" style="width:100%;max-width:400px;">';
        }
        echo '</td></tr>';
    }
    echo '</table>';
}

function mahall_venue_media_cb( $post ) {
    $plan     = get_post_meta( $post->ID, 'mahall_plan', true ) ?: 'free';
    $featured = get_post_meta( $post->ID, 'mahall_featured', true );
    ?>
    <p><strong>Subscription plan</strong></p>
    <select name="mahall_plan" style="width:100%;margin-bottom:12px;">
        <option value="free"     <?php selected( $plan, 'free' );     ?>>Free listing</option>
        <option value="featured" <?php selected( $plan, 'featured' ); ?>>Featured — 499 MAD/mo</option>
        <option value="premium"  <?php selected( $plan, 'premium' );  ?>>Premium — 1,200 MAD/mo</option>
    </select>
    <label style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <input type="checkbox" name="mahall_featured" value="1" <?php checked( $featured, '1' ); ?>>
        <span>Homepage featured placement</span>
    </label>
    <hr>
    <p style="font-size:12px;color:#666;margin-top:8px;">
        Photo gallery: managed via the Featured Image and additional uploads in the v0.3 onboarding flow.<br>
        Set post status to <strong>Publish</strong> to make the venue live, <strong>Pending</strong> to queue for review, <strong>Private</strong> to suspend.
    </p>
    <?php
}

add_action( 'save_post_mahall_venue', 'mahall_save_venue_meta' );
function mahall_save_venue_meta( $post_id ) {
    if ( ! isset( $_POST['mahall_venue_nonce'] ) ) return;
    if ( ! wp_verify_nonce( $_POST['mahall_venue_nonce'], 'mahall_venue_save' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;

    $text_fields = array(
        'mahall_city', 'mahall_area', 'mahall_host_name', 'mahall_host_email',
        'mahall_host_phone', 'mahall_size', 'mahall_video_url', 'mahall_tour_url', 'mahall_plan',
    );
    $int_fields = array( 'mahall_capacity', 'mahall_price_from', 'mahall_rooms' );

    foreach ( $text_fields as $field ) {
        if ( isset( $_POST[ $field ] ) ) {
            update_post_meta( $post_id, $field, sanitize_text_field( $_POST[ $field ] ) );
        }
    }
    foreach ( $int_fields as $field ) {
        if ( isset( $_POST[ $field ] ) ) {
            update_post_meta( $post_id, $field, absint( $_POST[ $field ] ) );
        }
    }
    if ( isset( $_POST['mahall_amenities'] ) ) {
        update_post_meta( $post_id, 'mahall_amenities', sanitize_textarea_field( $_POST['mahall_amenities'] ) );
    }
    update_post_meta( $post_id, 'mahall_featured', isset( $_POST['mahall_featured'] ) ? '1' : '' );
}

/* ================================================================
   5. LEAD META BOXES
================================================================ */

add_action( 'add_meta_boxes', 'mahall_add_lead_meta_boxes' );
function mahall_add_lead_meta_boxes() {
    add_meta_box( 'mahall_lead_details', 'Inquiry details', 'mahall_lead_details_cb', 'mahall_lead', 'normal', 'high' );
    add_meta_box( 'mahall_lead_status',  'Status & actions', 'mahall_lead_status_cb',  'mahall_lead', 'side',   'default' );
}

function mahall_lead_details_cb( $post ) {
    $fields = array(
        'venue'     => 'Venue',
        'name'      => 'Client name',
        'email'     => 'Client email',
        'eventType' => 'Event type',
        'date'      => 'Requested date',
        'guests'    => 'Guest count',
        'message'   => 'Message',
    );
    echo '<table class="form-table">';
    foreach ( $fields as $key => $label ) {
        $val = get_post_meta( $post->ID, $key, true );
        echo '<tr><th style="width:160px;padding:6px 12px;">' . esc_html( $label ) . '</th>';
        echo '<td style="padding:6px 12px;">';
        if ( $key === 'message' ) {
            echo '<div style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:10px;max-width:500px;font-style:italic;">' . nl2br( esc_html( $val ) ) . '</div>';
        } elseif ( $key === 'email' ) {
            echo '<a href="mailto:' . esc_attr( $val ) . '">' . esc_html( $val ) . '</a>';
        } else {
            echo esc_html( $val ?: '—' );
        }
        echo '</td></tr>';
    }
    echo '</table>';
}

function mahall_lead_status_cb( $post ) {
    $status = get_post_meta( $post->ID, 'mahall_lead_status', true ) ?: 'new';
    $colours = array( 'new' => '#B5722A', 'accepted' => '#3F8172', 'declined' => '#B5532D', 'archived' => '#736C61' );
    $colour  = $colours[ $status ] ?? '#736C61';
    echo '<p><strong style="color:' . esc_attr( $colour ) . ';text-transform:capitalize;">' . esc_html( $status ) . '</strong></p>';
    echo '<select name="mahall_lead_status_select" style="width:100%;margin-bottom:8px;">';
    foreach ( array( 'new', 'accepted', 'declined', 'archived' ) as $s ) {
        echo '<option value="' . esc_attr( $s ) . '"' . selected( $status, $s, false ) . '>' . ucfirst( $s ) . '</option>';
    }
    echo '</select>';
    echo '<input type="submit" class="button button-primary" value="Update status" style="width:100%;">';
}

add_action( 'save_post_mahall_lead', function( $post_id ) {
    if ( isset( $_POST['mahall_lead_status_select'] ) && current_user_can( 'edit_post', $post_id ) ) {
        $allowed = array( 'new', 'accepted', 'declined', 'archived' );
        $val = sanitize_text_field( $_POST['mahall_lead_status_select'] );
        if ( in_array( $val, $allowed, true ) ) {
            update_post_meta( $post_id, 'mahall_lead_status', $val );
        }
    }
} );

/* ================================================================
   6. /owner/plan REST ENDPOINT
================================================================ */

add_action( 'rest_api_init', function () {
    register_rest_route( 'mahall/v1', '/owner/plan', array(
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'callback'            => function () {
            if ( ! is_user_logged_in() ) {
                return new WP_REST_Response( array( 'plan' => 'free' ), 200 );
            }
            $user_id  = get_current_user_id();
            /* Find the user's venue post */
            $posts = get_posts( array(
                'post_type'      => 'mahall_venue',
                'post_status'    => array( 'publish', 'pending', 'private' ),
                'author'         => $user_id,
                'posts_per_page' => 1,
                'fields'         => 'ids',
            ) );
            $plan = 'free';
            if ( ! empty( $posts ) ) {
                $plan = get_post_meta( $posts[0], 'mahall_plan', true ) ?: 'free';
            }
            return new WP_REST_Response( array( 'plan' => $plan ), 200 );
        },
    ) );
} );

/* ================================================================
   7. TOOLS → EXPORT VENUES JSON (for mahall-ai-proxy Mode B)
================================================================ */

add_action( 'admin_menu', function () {
    add_management_page( 'Export Mahal Venues', 'Mahal: Export venues', 'manage_options', 'mahall-export', 'mahall_export_page' );
} );

function mahall_export_page() {
    if ( isset( $_POST['mahall_do_export'] ) && check_admin_referer( 'mahall_export' ) ) {
        $venues = get_posts( array( 'post_type' => 'mahall_venue', 'post_status' => 'publish', 'posts_per_page' => -1 ) );
        $out = array();
        foreach ( $venues as $v ) {
            $amenities_raw = get_post_meta( $v->ID, 'mahall_amenities', true );
            $amenities     = $amenities_raw ? array_filter( array_map( 'trim', explode( "\n", $amenities_raw ) ) ) : array();
            $out[] = array(
                'id'         => $v->ID,
                'name'       => $v->post_title,
                'category'   => ( function() use ( $v ) {
                    $terms = get_the_terms( $v->ID, 'mahall_category' );
                    return $terms ? $terms[0]->slug : '';
                })(),
                'city'       => get_post_meta( $v->ID, 'mahall_city', true ),
                'capacity'   => (int) get_post_meta( $v->ID, 'mahall_capacity', true ),
                'price_from' => (int) get_post_meta( $v->ID, 'mahall_price_from', true ),
                'amenities'  => array_values( $amenities ),
                'status'     => 'live',
            );
        }
        $json     = wp_json_encode( $out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE );
        $dir      = WP_CONTENT_DIR . '/uploads/mahall';
        $filepath = $dir . '/venues.json';
        wp_mkdir_p( $dir );
        file_put_contents( $filepath, $json );
        echo '<div class="notice notice-success"><p>Exported ' . count( $out ) . ' venues to <code>' . esc_html( $filepath ) . '</code>.</p></div>';
    }
    ?>
    <div class="wrap">
        <h1>Export Mahal venues to JSON</h1>
        <p>Exports all <strong>published</strong> venues to <code>wp-content/uploads/mahall/venues.json</code> — the file the AI proxy reads in Mode B.</p>
        <p>Run this export after adding or editing venues, so the AI search and concierge have up-to-date data.</p>
        <form method="post"><?php wp_nonce_field( 'mahall_export' ); ?>
            <input type="hidden" name="mahall_do_export" value="1">
            <?php submit_button( 'Export venues.json', 'primary', 'submit', false ); ?>
        </form>
    </div>
    <?php
}

/* ================================================================
   8. FLUSH REWRITE RULES ON ACTIVATION
   Run once when the plugin/functions.php first loads the CPT.
   Ensures /venues/riad-zahra works without a manual Settings →
   Permalinks save.
================================================================ */

register_activation_hook( __FILE__, function () {
    mahall_register_post_types();
    flush_rewrite_rules();
} );

/* Safe fallback: also flush on init if the option flag is set */
add_action( 'init', function () {
    if ( get_option( 'mahall_flush_needed' ) ) {
        flush_rewrite_rules();
        delete_option( 'mahall_flush_needed' );
    }
}, 99 );

add_action( 'activated_plugin', function () {
    update_option( 'mahall_flush_needed', true );
} );

/* ================================================================
   OWNER EMAIL FILTER
   Override the email address that receives lead notifications.
   The v0.6 proxy fires: apply_filters('mahall_owner_email', admin_email, venue_name)
   This filter resolves the venue name to the actual host's email.
================================================================ */

add_filter( 'mahall_owner_email', function ( $default_email, $venue_name ) {
    $posts = get_posts( array(
        'post_type'      => 'mahall_venue',
        'title'          => $venue_name,
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'fields'         => 'ids',
    ) );
    if ( ! empty( $posts ) ) {
        $host_email = get_post_meta( $posts[0], 'mahall_host_email', true );
        if ( is_email( $host_email ) ) return $host_email;
    }
    return $default_email;
}, 10, 2 );
